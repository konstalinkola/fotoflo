import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

interface WebhookPayload {
	project_id: string;
	files: Array<{
		name: string;
		url: string;
		size?: number;
		type?: string;
		metadata?: Record<string, unknown>;
	}>;
	batch_id?: string;
	collection_id?: string;
	source?: string;
	timestamp?: string;
}

interface WebhookResponse {
	success: boolean;
	batch_id?: string;
	processed_files: number;
	successful_uploads: number;
	failed_uploads: number;
	errors?: string[];
	message?: string;
}

export async function POST(request: NextRequest) {
	const supabase = await createSupabaseServerClient();
	
	// Verify webhook signature if secret is provided
	const webhookSecret = request.headers.get('x-webhook-secret');
	const payload = await request.json() as WebhookPayload;

	// Validate payload
	if (!payload.project_id || !payload.files || !Array.isArray(payload.files)) {
		return NextResponse.json({ 
			error: "Invalid payload. Required: project_id, files array" 
		}, { status: 400 });
	}

	// Get auto upload config for the project
	const { data: config, error: configError } = await supabase
		.from("auto_upload_config")
		.select("*")
		.eq("project_id", payload.project_id)
		.single();

	if (configError || !config) {
		return NextResponse.json({ 
			error: "Auto upload not configured for this project" 
		}, { status: 404 });
	}

	// Verify webhook secret if configured
	if (config.webhook_secret && webhookSecret !== config.webhook_secret) {
		return NextResponse.json({ 
			error: "Invalid webhook secret" 
		}, { status: 401 });
	}

	// Get project details
	const { data: project, error: projectError } = await supabase
		.from("projects")
		.select("storage_bucket, storage_prefix, owner")
		.eq("id", payload.project_id)
		.single();
	
	if (projectError || !project) {
		return NextResponse.json({ 
			error: "Project not found" 
		}, { status: 404 });
	}

	const batchId = payload.batch_id || `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	let successfulUploads = 0;
	let failedUploads = 0;
	const errors: string[] = [];

	// Process each file from the webhook
	for (const fileInfo of payload.files) {
		try {
			// Download file from URL
			const fileResponse = await fetch(fileInfo.url);
			if (!fileResponse.ok) {
				errors.push(`Failed to download ${fileInfo.name}: ${fileResponse.statusText}`);
				failedUploads++;
				continue;
			}

			const fileBuffer = await fileResponse.arrayBuffer();
			const file = new File([fileBuffer], fileInfo.name, {
				type: fileInfo.type || 'application/octet-stream'
			});

			// Validate file type
			const allowedFormats = config.allowed_formats || ["image/jpeg", "image/jpg", "image/png", "image/webp"];
			if (!allowedFormats.includes(file.type)) {
				errors.push(`Invalid file type for ${fileInfo.name}: ${file.type}`);
				failedUploads++;
				continue;
			}

			// Validate file size
			const maxFileSize = config.max_file_size || 10 * 1024 * 1024;
			if (file.size > maxFileSize) {
				errors.push(`File too large for ${fileInfo.name}: ${Math.round(file.size / (1024 * 1024))}MB`);
				failedUploads++;
				continue;
			}

			// Check for duplicates if enabled
			if (config.duplicate_detection) {
				const fileHash = await generateFileHash(file);
				const { data: existingImage } = await supabase
					.from("images")
					.select("id")
					.eq("project_id", payload.project_id)
					.eq("file_hash", fileHash)
					.single();

				if (existingImage) {
					errors.push(`Duplicate file detected: ${fileInfo.name}`);
					failedUploads++;
					continue;
				}
			}

			// Create file path
			const timestamp = Date.now();
			const fileExtension = fileInfo.name.split('.').pop();
			const fileName = `${timestamp}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
			const securePath = `${payload.project_id}/${fileName}`;

			// Upload to storage
			const admin = createSupabaseServiceClient();
			const { data: uploadData, error: uploadError } = await admin.storage
				.from(project.storage_bucket)
				.upload(securePath, file, {
					cacheControl: "3600",
					upsert: false
				});

			if (uploadError) {
				errors.push(`Storage upload failed for ${fileInfo.name}: ${uploadError.message}`);
				failedUploads++;
				continue;
			}

			// Extract EXIF data if it's an image
			let exifData: Record<string, unknown> | null = null;
			if (file.type.startsWith('image/')) {
				try {
					const { parse } = await import('exifr');
					exifData = await parse(fileBuffer, {
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
			}

			// Save to database
			const fileHash = config.duplicate_detection ? await generateFileHash(file) : null;
			const imageMetadata = {
				project_id: payload.project_id,
				storage_path: uploadData.path,
				file_name: fileName,
				original_name: fileInfo.name,
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
				upload_batch_id: batchId,
				upload_source: payload.source || 'webhook',
				external_metadata: fileInfo.metadata || null,
				collection_id: payload.collection_id || null
			};

			const { error: dbError } = await supabase
				.from('images')
				.insert(imageMetadata);

			if (dbError) {
				console.error('Failed to save image metadata:', dbError);
				// Don't fail the upload if metadata saving fails
			}

			successfulUploads++;

		} catch (error) {
			errors.push(`Processing failed for ${fileInfo.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
			failedUploads++;
		}
	}

	// Save batch record
	await supabase
		.from("upload_batches")
		.insert({
			batch_id: batchId,
			project_id: payload.project_id,
			total_files: payload.files.length,
			successful_uploads: successfulUploads,
			failed_uploads: failedUploads,
			duplicates_skipped: 0,
			status: "completed",
			upload_source: payload.source || 'webhook',
			completed_at: new Date().toISOString()
		});

	const response: WebhookResponse = {
		success: successfulUploads > 0,
		batch_id: batchId,
		processed_files: payload.files.length,
		successful_uploads: successfulUploads,
		failed_uploads: failedUploads,
		errors: errors.length > 0 ? errors : undefined,
		message: `Processed ${payload.files.length} files: ${successfulUploads} successful, ${failedUploads} failed`
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

// GET endpoint to verify webhook configuration
export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const projectId = searchParams.get('project_id');
	const webhookSecret = request.headers.get('x-webhook-secret');

	if (!projectId) {
		return NextResponse.json({ error: "project_id parameter required" }, { status: 400 });
	}

	const supabase = await createSupabaseServerClient();
	
	// Get auto upload config
	const { data: config, error } = await supabase
		.from("auto_upload_config")
		.select("webhook_url, webhook_secret")
		.eq("project_id", projectId)
		.single();

	if (error || !config) {
		return NextResponse.json({ 
			error: "Auto upload not configured for this project" 
		}, { status: 404 });
	}

	// Verify webhook secret if configured
	if (config.webhook_secret && webhookSecret !== config.webhook_secret) {
		return NextResponse.json({ 
			error: "Invalid webhook secret" 
		}, { status: 401 });
	}

	return NextResponse.json({
		success: true,
		project_id: projectId,
		webhook_configured: !!config.webhook_url,
		message: "Webhook endpoint is active and ready to receive files"
	});
}
