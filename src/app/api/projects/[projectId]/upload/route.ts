import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { parse } from "exifr";
import { checkRequestSize, checkFileSize } from "@/lib/request-limits";
import { handleApiError, ERRORS } from "@/lib/error-handler";
import { sanitizeFileName } from "@/lib/validation";

interface ExifData {
	DateTimeOriginal?: string;
	CreateDate?: string;
	ModifyDate?: string;
	Make?: string;
	Model?: string;
	LensModel?: string;
	FocalLength?: number;
	FNumber?: number;
	ExposureTime?: number;
	ISO?: number;
	Flash?: number;
	ImageWidth?: number;
	ImageHeight?: number;
	GPSLatitude?: number;
	GPSLongitude?: number;
	GPSAltitude?: number;
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ projectId: string }> }
) {
	try {
		// Check request size
		const sizeCheck = checkRequestSize(request);
		if (!sizeCheck.allowed) {
			return NextResponse.json({ error: sizeCheck.error }, { status: 413 });
		}

		const { projectId } = await params;
	
		// Verify user owns this project
		const supabase = await createSupabaseServerClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw ERRORS.UNAUTHORIZED();

	const { data: project, error: projectError } = await supabase
		.from("projects")
		.select("storage_bucket, storage_prefix, owner")
		.eq("id", projectId)
		.eq("owner", user.id)
		.single();
	
	if (projectError || !project) {
		return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
	}

	// Parse multipart form data
	const formData = await request.formData();
	const file = formData.get("file") as File;
	
	if (!file) {
		return NextResponse.json({ error: "No file provided" }, { status: 400 });
	}

	// Validate file type
	const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
	if (!allowedTypes.includes(file.type)) {
		return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." }, { status: 400 });
	}

	// Validate file size using our centralized function
	const fileSizeCheck = checkFileSize(file);
	if (!fileSizeCheck.allowed) {
		return NextResponse.json({ error: fileSizeCheck.error }, { status: 400 });
	}

		// Sanitize and validate file name
		const sanitizedFileName = sanitizeFileName(file.name);
		if (!sanitizedFileName) {
			throw ERRORS.VALIDATION_ERROR('Invalid file name');
		}

		// Validate file extension matches MIME type
		const extension = sanitizedFileName.split('.').pop()?.toLowerCase();
	const mimeTypeMap: Record<string, string[]> = {
		'jpg': ['image/jpeg', 'image/jpg'],
		'jpeg': ['image/jpeg', 'image/jpg'],
		'png': ['image/png'],
		'webp': ['image/webp'],
	};
	
	if (!extension || !mimeTypeMap[extension]?.includes(file.type)) {
		return NextResponse.json({ error: "File extension does not match file type." }, { status: 400 });
	}

	// Create file path: project_id/filename (user bucket is already isolated)
	const timestamp = Date.now();
	const fileExtension = file.name.split('.').pop();
	const secureFileName = `${timestamp}.${fileExtension}`;
	const securePath = `${projectId}/${secureFileName}`;

	// Extract EXIF data from the image
	let exifData: ExifData | null = null;
	try {
		const arrayBuffer = await file.arrayBuffer();
		exifData = await parse(arrayBuffer, {
			pick: [
				'DateTimeOriginal',
				'CreateDate', 
				'ModifyDate',
				'Make',
				'Model',
				'LensModel',
				'FocalLength',
				'FNumber',
				'ExposureTime',
				'ISO',
				'Flash',
				'ImageWidth',
				'ImageHeight',
				'GPSLatitude',
				'GPSLongitude',
				'GPSAltitude'
			]
		});
	} catch (exifError) {
		console.warn('Failed to extract EXIF data:', exifError);
		// Continue with upload even if EXIF extraction fails
	}

	// Upload to Supabase Storage using service client
	const admin = createSupabaseServiceClient();
	const { data, error: uploadError } = await admin.storage
		.from(project.storage_bucket)
		.upload(securePath, file, {
			cacheControl: "3600",
			upsert: false
		});

	if (uploadError) {
		// Provide more helpful error messages
		let errorMessage = uploadError.message;
		if (uploadError.message.includes("Bucket not found")) {
			errorMessage = "Storage bucket not found. Please contact support to set up your storage.";
		} else if (uploadError.message.includes("quota")) {
			errorMessage = "Storage quota exceeded. Please delete some old photos or upgrade your plan.";
		} else if (uploadError.message.includes("size")) {
			errorMessage = "File too large. Maximum size is 10MB.";
		}
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}

	// Save image metadata to database
	try {
		const imageMetadata = {
			project_id: projectId,
			storage_path: data.path,
			file_name: sanitizedFileName,
			file_size: file.size,
			file_type: file.type,
		capture_time: exifData?.DateTimeOriginal || exifData?.CreateDate || exifData?.ModifyDate || null,
		camera_make: exifData?.Make || null,
		camera_model: exifData?.Model || null,
		lens_model: exifData?.LensModel || null,
		focal_length: exifData?.FocalLength ? parseFloat(exifData.FocalLength.toString()) : null,
		aperture: exifData?.FNumber ? parseFloat(exifData.FNumber.toString()) : null,
		shutter_speed: exifData?.ExposureTime ? `${exifData.ExposureTime}s` : null,
		iso: exifData?.ISO || null,
		flash: exifData?.Flash ? exifData.Flash !== 0 : null,
		width: exifData?.ImageWidth || null,
		height: exifData?.ImageHeight || null,
		gps_latitude: exifData?.GPSLatitude || null,
		gps_longitude: exifData?.GPSLongitude || null,
		gps_altitude: exifData?.GPSAltitude || null
		};

		console.log('Attempting to save image metadata:', imageMetadata);
		const { data: insertedImage, error: dbError } = await supabase
			.from('images')
			.insert(imageMetadata)
			.select('id')
			.single();

		let imageId = null;
		if (dbError) {
			console.error('Failed to save image metadata:', dbError);
			// Check if it's because the table doesn't exist
			if (dbError.message.includes('relation "images" does not exist') || 
				dbError.message.includes('does not exist') ||
				dbError.code === 'PGRST116') {
				console.log('Images table does not exist yet. Metadata will be saved once table is created.');
			}
			// Don't fail the upload if metadata saving fails
		} else {
			imageId = insertedImage?.id;
			console.log('Successfully saved image metadata with ID:', imageId);
		}

		// Return both path and image ID if available
		return NextResponse.json({ 
			success: true, 
			path: data.path,
			imageId: imageId,
			message: "File uploaded successfully" 
		});
		} catch (metadataError) {
			console.error('Error processing image metadata:', metadataError);
			// Don't fail the upload if metadata processing fails
			return NextResponse.json({ 
				success: true, 
				path: data.path,
				imageId: null,
				message: "File uploaded successfully" 
			});
		}
	} catch (error) {
		return handleApiError(error, '/api/projects/[projectId]/upload');
	}
}
