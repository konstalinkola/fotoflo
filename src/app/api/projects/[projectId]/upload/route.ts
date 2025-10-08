import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { parse } from "exifr";
import { checkRequestSize, checkFileSize } from "@/lib/request-limits";
import { handleApiError, ERRORS } from "@/lib/error-handler";
import { sanitizeFileName } from "@/lib/validation";

/**
 * EXIF data extracted from uploaded images
 */
interface ExifData {
	/** Original date/time when photo was taken */
	DateTimeOriginal?: string;
	/** Creation date from EXIF */
	CreateDate?: string;
	/** Modification date from EXIF */
	ModifyDate?: string;
	/** Camera manufacturer */
	Make?: string;
	/** Camera model */
	Model?: string;
	/** Lens model used */
	LensModel?: string;
	/** Focal length in mm */
	FocalLength?: number;
	/** Aperture (f-number) */
	FNumber?: number;
	/** Shutter speed/exposure time */
	ExposureTime?: number;
	/** ISO sensitivity */
	ISO?: number;
	/** Flash usage (0 = no flash, 1 = flash) */
	Flash?: number;
	/** Image width in pixels */
	ImageWidth?: number;
	/** Image height in pixels */
	ImageHeight?: number;
	/** GPS latitude coordinate */
	GPSLatitude?: number;
	/** GPS longitude coordinate */
	GPSLongitude?: number;
	/** GPS altitude in meters */
	GPSAltitude?: number;
}

/**
 * Handles file uploads to a specific project
 * 
 * This endpoint processes multipart/form-data uploads, extracts EXIF metadata,
 * validates file types and sizes, and stores files in Supabase Storage.
 * 
 * @param request - Next.js request object containing the upload
 * @param params - Route parameters containing projectId
 * @returns JSON response with upload results
 * 
 * @throws {413} When request or file size exceeds limits
 * @throws {400} When file type is invalid or project not found
 * @throws {500} When upload or database operations fail
 * 
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('file', imageFile);
 * 
 * const response = await fetch('/api/projects/project-123/upload', {
 *   method: 'POST',
 *   body: formData
 * });
 * 
 * const result = await response.json();
 * console.log('Uploaded:', result.uploadedFiles);
 * ```
 */
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
	
		// Check for Bearer token (for desktop app) or use session (for web app)
		const authHeader = request.headers.get('authorization');
		let supabase;
		let user;
		
		if (authHeader?.startsWith('Bearer ')) {
			// Desktop app authentication with Bearer token
			const token = authHeader.substring(7);
			const { createClient } = await import('@supabase/supabase-js');
			const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
			const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
			
			supabase = createClient(supabaseUrl, supabaseAnonKey, {
				global: {
					headers: {
						Authorization: `Bearer ${token}`
					}
				}
			});
			
			const { data: { user: tokenUser }, error: authError } = await supabase.auth.getUser(token);
			if (authError || !tokenUser) {
				console.error('Bearer token auth failed:', authError);
				throw ERRORS.UNAUTHORIZED();
			}
			user = tokenUser;
		} else {
			// Web app authentication with session cookies
			supabase = await createSupabaseServerClient();
			const { data: { user: sessionUser } } = await supabase.auth.getUser();
			if (!sessionUser) throw ERRORS.UNAUTHORIZED();
			user = sessionUser;
		}

	const { data: project, error: projectError } = await supabase
		.from("projects")
		.select("storage_bucket, storage_prefix, owner, display_mode")
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

		// For collection projects, create or use a current collection
		console.log('Project display mode:', project.display_mode, 'Image ID:', imageId);
		
		if (project.display_mode === 'collection' && imageId) {
			console.log('Processing collection project - finding or creating collection');
			try {
				// First, try to find an existing "New Collection" (collection_number: 1)
				// This represents the current batch of uploads
				const { data: currentCollection, error: collectionError } = await supabase
					.from("collections")
					.select("id")
					.eq("project_id", projectId)
					.eq("collection_number", 1)
					.single();

				console.log('Current collection check:', { currentCollection, collectionError });

				let finalCollection = currentCollection;
				
				if (collectionError || !currentCollection) {
					console.log('Creating New Collection (collection number 1) for current batch');
					// Create "New Collection" (collection number 1) for current upload batch
					const { data: createdCollection, error: createError } = await supabase
						.from("collections")
						.insert({
							project_id: projectId,
							collection_number: 1
						})
						.select("id")
						.single();

					if (createError) {
						console.error('Failed to create New Collection:', createError);
					} else {
						finalCollection = createdCollection;
						console.log('✅ Created New Collection with ID:', finalCollection.id);
					}
				} else {
					console.log('✅ Using existing New Collection with ID:', finalCollection.id);
				}

				if (finalCollection) {
					console.log('Adding image to collection:', { collectionId: finalCollection.id, imageId });
					// Add image to the collection
					const { error: addError } = await supabase
						.from("collection_images")
						.insert({
							collection_id: finalCollection.id,
							image_id: imageId,
							sort_order: 0 // Will be updated by trigger
						});

					if (addError) {
						console.error('❌ Failed to add image to collection:', addError);
					} else {
						console.log('✅ Successfully added image to New Collection');
					}
				} else {
					console.error('❌ No collection available to add image to');
				}
			} catch (collectionError) {
				console.error('❌ Error handling collection assignment:', collectionError);
				// Don't fail the upload if collection assignment fails
			}
		} else {
			console.log('Skipping collection assignment - display_mode:', project.display_mode, 'imageId:', imageId);
		}

		// Return both path and image ID if available
		return NextResponse.json({ 
			success: true, 
			path: data.path,
			imageId: imageId,
			message: "File uploaded successfully",
			projectDisplayMode: project.display_mode,
			addedToCollection: project.display_mode === 'collection' && imageId ? true : false
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
