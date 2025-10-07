import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { parse } from "exifr";

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

interface UploadResult {
	file_name: string;
	success: boolean;
	image_id?: string;
	storage_path?: string;
	error?: string;
	duplicate_detected?: boolean;
}

interface BatchUploadResponse {
	batch_id: string;
	total_files: number;
	successful_uploads: number;
	failed_uploads: number;
	duplicates_skipped: number;
	results: UploadResult[];
	estimated_completion?: string;
}

export async function POST(request: NextRequest) {
	// Get projectId from query params since this route doesn't have dynamic segments
	const { searchParams } = new URL(request.url);
	const projectId = searchParams.get('projectId');
	
	if (!projectId) {
		return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
	}
	const supabase = await createSupabaseServerClient();
	
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	// Get project details
	const { data: project, error: projectError } = await supabase
		.from("projects")
		.select("storage_bucket, storage_prefix, owner")
		.eq("id", projectId)
		.eq("owner", user.id)
		.single();
	
	if (projectError || !project) {
		return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
	}

	// Get auto upload config
	const { data: config } = await supabase
		.from("auto_upload_config")
		.select("*")
		.eq("project_id", projectId)
		.single();

	// Use config defaults if no config exists
	const maxFileSize = config?.max_file_size || 10 * 1024 * 1024;
	const allowedFormats = config?.allowed_formats || ["image/jpeg", "image/jpg", "image/png", "image/webp"];
	const duplicateDetection = config?.duplicate_detection ?? true;

	// Parse multipart form data
	const formData = await request.formData();
	const files = formData.getAll("files") as File[];
	
	if (!files || files.length === 0) {
		return NextResponse.json({ error: "No files provided" }, { status: 400 });
	}

	// Generate batch ID for tracking
	const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

	const results: UploadResult[] = [];
	let successfulUploads = 0;
	let failedUploads = 0;
	let duplicatesSkipped = 0;

	// Process files in batches to avoid overwhelming the system
	const batchSize = 5;
	const fileBatches: File[][] = [];
	for (let i = 0; i < files.length; i += batchSize) {
		fileBatches.push(files.slice(i, i + batchSize));
	}

	for (const batch of fileBatches) {
		const batchPromises = batch.map(async (file): Promise<UploadResult> => {
			try {
				// Validate file type
				if (!allowedFormats.includes(file.type)) {
					return {
						file_name: file.name,
						success: false,
						error: `Invalid file type. Only ${allowedFormats.join(", ")} are allowed.`
					};
				}

				// Validate file size
				if (file.size > maxFileSize) {
					return {
						file_name: file.name,
						success: false,
						error: `File too large. Maximum size is ${Math.round(maxFileSize / (1024 * 1024))}MB.`
					};
				}

				// Check for duplicates if enabled
				if (duplicateDetection) {
					const fileHash = await generateFileHash(file);
					const { data: existingImage } = await supabase
						.from("images")
						.select("id")
						.eq("project_id", projectId)
						.eq("file_hash", fileHash)
						.single();

					if (existingImage) {
						return {
							file_name: file.name,
							success: false,
							duplicate_detected: true,
							error: "Duplicate file detected"
						};
					}
				}

				// Create file path
				const timestamp = Date.now();
				const fileExtension = file.name.split('.').pop();
				const fileName = `${timestamp}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
				const securePath = `${projectId}/${fileName}`;

				// Extract EXIF data
				let exifData: ExifData | null = null;
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

				// Upload to storage
				const admin = createSupabaseServiceClient();
				const { data: uploadData, error: uploadError } = await admin.storage
					.from(project.storage_bucket)
					.upload(securePath, file, {
						cacheControl: "3600",
						upsert: false
					});

				if (uploadError) {
					return {
						file_name: file.name,
						success: false,
						error: uploadError.message
					};
				}

				// Save to database
				const fileHash = duplicateDetection ? await generateFileHash(file) : null;
				const imageMetadata = {
					project_id: projectId,
					storage_path: uploadData.path,
					file_name: fileName,
					file_size: file.size,
					file_type: file.type,
					file_hash: fileHash,
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
					gps_altitude: exifData?.GPSAltitude || null,
					upload_batch_id: batchId
				};

				const { data: insertedImage, error: dbError } = await supabase
					.from('images')
					.insert(imageMetadata)
					.select('id')
					.single();

				if (dbError) {
					console.error('Failed to save image metadata:', dbError);
					// Still return success since file was uploaded to storage
				}

				return {
					file_name: file.name,
					success: true,
					image_id: insertedImage?.id,
					storage_path: uploadData.path
				};

			} catch (error) {
				return {
					file_name: file.name,
					success: false,
					error: error instanceof Error ? error.message : "Unknown error"
				};
			}
		});

		const batchResults = await Promise.all(batchPromises);
		results.push(...batchResults);

		// Update counters
		batchResults.forEach(result => {
			if (result.success) {
				successfulUploads++;
			} else if (result.duplicate_detected) {
				duplicatesSkipped++;
			} else {
				failedUploads++;
			}
		});

		// Small delay between batches to prevent overwhelming the system
		if (fileBatches.indexOf(batch) < fileBatches.length - 1) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}
	}

	// Save batch record for tracking
	await supabase
		.from("upload_batches")
		.insert({
			batch_id: batchId,
			project_id: projectId,
			total_files: files.length,
			successful_uploads: successfulUploads,
			failed_uploads: failedUploads,
			duplicates_skipped: duplicatesSkipped,
			status: "completed",
			completed_at: new Date().toISOString()
		});

	const response: BatchUploadResponse = {
		batch_id: batchId,
		total_files: files.length,
		successful_uploads: successfulUploads,
		failed_uploads: failedUploads,
		duplicates_skipped: duplicatesSkipped,
		results: results
	};

	return NextResponse.json(response);
}

// Helper function to generate file hash for duplicate detection
async function generateFileHash(file: File): Promise<string> {
	const arrayBuffer = await file.arrayBuffer();
	const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function GET(request: NextRequest) {
	// Get projectId from query params since this route doesn't have dynamic segments
	const { searchParams } = new URL(request.url);
	const projectId = searchParams.get('projectId');
	
	if (!projectId) {
		return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
	}
	const supabase = await createSupabaseServerClient();
	
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	// Verify user owns this project
	const { data: project, error: projectError } = await supabase
		.from("projects")
		.select("id, owner")
		.eq("id", projectId)
		.eq("owner", user.id)
		.single();
	
	if (projectError || !project) {
		return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
	}

	// Get upload batch history
	const { data: batches, error } = await supabase
		.from("upload_batches")
		.select("*")
		.eq("project_id", projectId)
		.order("created_at", { ascending: false })
		.limit(20);

	if (error) {
		return NextResponse.json({ error: "Failed to fetch upload history" }, { status: 500 });
	}

	return NextResponse.json({ batches: batches || [] });
}
