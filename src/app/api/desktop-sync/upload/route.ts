import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { parse } from "exifr";
import { broadcastToProject } from "../../projects/[projectId]/events/route";

// Configure runtime for large file uploads
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large file uploads

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

export async function POST(request: NextRequest) {
	try {
		// Debug: Log request headers
		console.log('📡 Desktop sync upload request headers:', Object.fromEntries(request.headers.entries()));
		console.log('📡 Content-Type:', request.headers.get('content-type'));
		console.log('📡 Content-Length:', request.headers.get('content-length'));

		// Get project ID from query params
		const { searchParams } = new URL(request.url);
		const projectId = searchParams.get('projectId');
		
		if (!projectId) {
			return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
		}

		// Parse multipart form data
		const formData = await request.formData();
		const file = formData.get("file") as File;
		
		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		// Validate file type
		const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
		if (!allowedTypes.includes(file.type)) {
			return NextResponse.json({ error: "Invalid file type. Only image files are allowed." }, { status: 400 });
		}

		// Validate file size (50MB max for desktop sync)
		const maxSize = 50 * 1024 * 1024; // 50MB
		if (file.size > maxSize) {
			return NextResponse.json({ error: "File too large. Maximum size is 50MB." }, { status: 400 });
		}

		// Get project details (no auth required for desktop sync)
		const admin = createSupabaseServiceClient();
		const { data: project, error: projectError } = await admin
			.from("projects")
			.select("id, storage_bucket, storage_prefix")
			.eq("id", projectId)
			.single();
		
		if (projectError || !project) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}

		// Create file path
		const timestamp = Date.now();
		const fileExtension = file.name.split('.').pop();
		const fileName = `${timestamp}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
		const securePath = `${projectId}/${fileName}`;

		// Upload to storage
		const { data: uploadData, error: uploadError } = await admin.storage
			.from(project.storage_bucket)
			.upload(securePath, file, {
				cacheControl: "3600",
				upsert: false
			});

		if (uploadError) {
			console.error("Upload error:", uploadError);
			return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 });
		}

		// Extract EXIF data (only for files under 20MB to avoid memory issues)
		let exifData: ExifData | null = null;
		if (file.size < 20 * 1024 * 1024) { // Only process EXIF for files under 20MB
			try {
				const arrayBuffer = await file.arrayBuffer();
				exifData = await parse(arrayBuffer, {
					pick: [
						'DateTimeOriginal', 'CreateDate', 'ModifyDate',
						'Make', 'Model', 'LensModel', 'FocalLength',
						'FNumber', 'ExposureTime', 'ISO', 'Flash',
						'ImageWidth', 'ImageHeight', 'GPSLatitude',
						'GPSLongitude', 'GPSAltitude'
					]
				});
			} catch (exifError) {
				console.warn('Failed to extract EXIF data:', exifError);
			}
		} else {
			console.log('Skipping EXIF extraction for large file:', file.name, 'Size:', file.size);
		}

		// Find the inactive collection (the "New Collection") for this project
		// Only if this is a collection mode project
		let newCollectionId = null;
		try {
			const { data: project, error: projectError } = await admin
				.from('projects')
				.select('display_mode')
				.eq('id', projectId)
				.single();

			if (!projectError && project?.display_mode === 'collection') {
				const { data: inactiveCollections, error: collectionError } = await admin
					.from('collections')
					.select('id, collection_number')
					.eq('project_id', projectId)
					.eq('is_active', false)
					.order('collection_number', { ascending: false })
					.limit(1);
				
				if (collectionError || !inactiveCollections || inactiveCollections.length === 0) {
					console.log('No inactive collection found:', collectionError?.message || 'No inactive collections');
				} else {
					newCollectionId = inactiveCollections[0].id;
					console.log('Found "New Collection" for desktop sync:', newCollectionId, 'collection_number:', inactiveCollections[0].collection_number);
				}
			} else {
				console.log('Project is in single mode, not assigning to collection');
			}
		} catch (error) {
			console.log('Collection lookup failed:', error instanceof Error ? error.message : String(error));
		}

		// Save to database using service client (with proper error handling)
		// Only include columns that exist in the current schema
		const imageMetadata: Record<string, unknown> = {
			project_id: projectId,
			storage_path: uploadData.path,
			file_name: file.name,
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

		// Add collection_id if we found one for collection mode projects
		if (newCollectionId) {
			imageMetadata.collection_id = newCollectionId;
			console.log('Assigning image to collection:', newCollectionId);
		}

		console.log('Attempting to save image metadata:', imageMetadata);
		
		const { data: insertedImage, error: dbError } = await admin
			.from('images')
			.insert(imageMetadata)
			.select('id')
			.single();

		if (dbError) {
			console.error('Failed to save image metadata:', dbError);
			console.error('Error details:', {
				code: dbError.code,
				message: dbError.message,
				details: dbError.details,
				hint: dbError.hint
			});
			
			// Check if it's because the table doesn't exist
			if (dbError.message.includes('relation "images" does not exist') || 
				dbError.message.includes('does not exist') ||
				dbError.code === 'PGRST116') {
				console.log('Images table does not exist yet. Metadata will be saved once table is created.');
			}
			// Don't fail the upload if metadata saving fails
		} else {
			console.log('Successfully saved image metadata with ID:', insertedImage?.id);
			
			// Auto-activate the new image for single mode projects
			try {
				const { data: project, error: projectError } = await admin
					.from('projects')
					.select('display_mode')
					.eq('id', projectId)
					.single();

				if (!projectError && project?.display_mode === 'single') {
					console.log('Auto-activating new image for single mode project');
					const { error: updateError } = await admin
						.from('projects')
						.update({ active_image_path: securePath })
						.eq('id', projectId);
					
					if (updateError) {
						console.error('Failed to auto-activate image:', updateError);
					} else {
						console.log('Successfully auto-activated new image');
					}
				}
			} catch (error) {
				console.error('Error auto-activating image:', error);
			}
			
			// Broadcast the new image to all connected clients
			broadcastToProject(projectId, {
				type: 'new_image',
				data: {
					id: insertedImage?.id,
					name: fileName,
					path: securePath,
					created_at: new Date().toISOString(),
					project_id: projectId
				}
			});
		}

		return NextResponse.json({
			success: true,
			imageId: insertedImage?.id,
			fileName: file.name,
			message: "File uploaded successfully via desktop sync"
		});

	} catch (error) {
		console.error("Desktop sync upload error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
