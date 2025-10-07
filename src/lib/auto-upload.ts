import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export interface AutoUploadConfig {
	project_id: string;
	auto_organize: boolean;
	duplicate_detection: boolean;
	max_file_size: number;
	allowed_formats: string[];
	webhook_url?: string;
	webhook_secret?: string;
	auto_collection_creation: boolean;
	collection_naming_pattern: string;
	background_processing: boolean;
}

export interface UploadBatch {
	batch_id: string;
	project_id: string;
	total_files: number;
	successful_uploads: number;
	failed_uploads: number;
	duplicates_skipped: number;
	status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
	upload_source: string;
	error_message?: string;
	created_at: string;
	updated_at: string;
	completed_at?: string;
}

export interface UploadResult {
	file_name: string;
	success: boolean;
	image_id?: string;
	storage_path?: string;
	error?: string;
	duplicate_detected?: boolean;
}

export interface BatchUploadResponse {
	batch_id: string;
	total_files: number;
	successful_uploads: number;
	failed_uploads: number;
	duplicates_skipped: number;
	results: UploadResult[];
	estimated_completion?: string;
}

export class AutoUploadService {
	private adminSupabase: ReturnType<typeof createSupabaseServiceClient>;

	constructor() {
		this.adminSupabase = createSupabaseServiceClient();
	}

	/**
	 * Get auto upload configuration for a project
	 */
	async getConfig(projectId: string): Promise<AutoUploadConfig | null> {
		const supabase = await createSupabaseServerClient();
		const { data, error } = await supabase
			.from("auto_upload_config")
			.select("*")
			.eq("project_id", projectId)
			.single();

		if (error && error.code !== 'PGRST116') {
			throw new Error(`Failed to fetch config: ${error.message}`);
		}

		return data;
	}

	/**
	 * Save auto upload configuration for a project
	 */
	async saveConfig(config: Partial<AutoUploadConfig>): Promise<AutoUploadConfig> {
		const configData = {
			...config,
			updated_at: new Date().toISOString()
		};

		const supabase = await createSupabaseServerClient();
		const { data, error } = await supabase
			.from("auto_upload_config")
			.upsert(configData, { 
				onConflict: "project_id"
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to save config: ${error.message}`);
		}

		return data;
	}

	/**
	 * Delete auto upload configuration for a project
	 */
	async deleteConfig(projectId: string): Promise<void> {
		const supabase = await createSupabaseServerClient();
		const { error } = await supabase
			.from("auto_upload_config")
			.delete()
			.eq("project_id", projectId);

		if (error) {
			throw new Error(`Failed to delete config: ${error.message}`);
		}
	}

	/**
	 * Process a batch upload of files
	 */
	async processBatchUpload(
		projectId: string,
		files: File[],
		options?: {
			collectionId?: string;
			source?: string;
			batchId?: string;
		}
	): Promise<BatchUploadResponse> {
		// Get project and config
		const [project, config] = await Promise.all([
			this.getProject(projectId),
			this.getConfig(projectId)
		]);

		if (!project) {
			throw new Error("Project not found");
		}

		// Use config defaults if no config exists
		const maxFileSize = config?.max_file_size || 10 * 1024 * 1024;
		const allowedFormats = config?.allowed_formats || ["image/jpeg", "image/jpg", "image/png", "image/webp"];
		const duplicateDetection = config?.duplicate_detection ?? true;

		const batchId = options?.batchId || `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const results: UploadResult[] = [];
		let successfulUploads = 0;
		let failedUploads = 0;
		let duplicatesSkipped = 0;

		// Create batch record
		await this.createBatchRecord(batchId, projectId, files.length, options?.source);

		// Process files in batches to avoid overwhelming the system
		const batchSize = 5;
		const fileBatches: File[][] = [];
		for (let i = 0; i < files.length; i += batchSize) {
			fileBatches.push(files.slice(i, i + batchSize));
		}

		for (const batch of fileBatches) {
			const batchPromises = batch.map(file => 
				this.processSingleFile(file, project, config, batchId, {
					maxFileSize,
					allowedFormats,
					duplicateDetection,
					collectionId: options?.collectionId
				})
			);

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

			// Small delay between batches
			if (fileBatches.indexOf(batch) < fileBatches.length - 1) {
				await new Promise(resolve => setTimeout(resolve, 100));
			}
		}

		// Update batch record
		await this.updateBatchRecord(batchId, {
			successful_uploads: successfulUploads,
			failed_uploads: failedUploads,
			duplicates_skipped: duplicatesSkipped,
			status: 'completed',
			completed_at: new Date().toISOString()
		});

		return {
			batch_id: batchId,
			total_files: files.length,
			successful_uploads: successfulUploads,
			failed_uploads: failedUploads,
			duplicates_skipped: duplicatesSkipped,
			results: results
		};
	}

	/**
	 * Process a single file upload
	 */
	private async processSingleFile(
		file: File,
		project: Record<string, unknown>,
		config: AutoUploadConfig | null,
		batchId: string,
		options: {
			maxFileSize: number;
			allowedFormats: string[];
			duplicateDetection: boolean;
			collectionId?: string;
		}
	): Promise<UploadResult> {
		try {
			// Validate file type
			if (!options.allowedFormats.includes(file.type)) {
				return {
					file_name: file.name,
					success: false,
					error: `Invalid file type. Only ${options.allowedFormats.join(", ")} are allowed.`
				};
			}

			// Validate file size
			if (file.size > options.maxFileSize) {
				return {
					file_name: file.name,
					success: false,
					error: `File too large. Maximum size is ${Math.round(options.maxFileSize / (1024 * 1024))}MB.`
				};
			}

			// Check for duplicates if enabled
			if (options.duplicateDetection) {
				const fileHash = await this.generateFileHash(file);
				const supabase = await createSupabaseServerClient();
				const { data: existingImage } = await supabase
					.from("images")
					.select("id")
					.eq("project_id", project.id as string)
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
			const securePath = `${project.id as string}/${fileName}`;

			// Extract EXIF data
			let exifData: Record<string, unknown> | null = null;
			try {
				const { parse } = await import('exifr');
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
			const { data: uploadData, error: uploadError } = await this.adminSupabase.storage
				.from(project.storage_bucket as string)
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
			const fileHash = options.duplicateDetection ? await this.generateFileHash(file) : null;
			const imageMetadata = {
				project_id: project.id as string,
				storage_path: uploadData.path,
				file_name: fileName,
				original_name: file.name,
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
				upload_source: 'auto-upload',
				collection_id: options.collectionId || null
			};

			const supabase = await createSupabaseServerClient();
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
	}

	/**
	 * Generate file hash for duplicate detection
	 */
	private async generateFileHash(file: File): Promise<string> {
		const arrayBuffer = await file.arrayBuffer();
		const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	}

	/**
	 * Get project details
	 */
	private async getProject(projectId: string): Promise<Record<string, unknown> | null> {
		const supabase = await createSupabaseServerClient();
		const { data, error } = await supabase
			.from("projects")
			.select("id, storage_bucket, storage_prefix, owner")
			.eq("id", projectId)
			.single();

		if (error) {
			throw new Error(`Project not found: ${error.message}`);
		}

		return data;
	}

	/**
	 * Create batch record
	 */
	private async createBatchRecord(
		batchId: string,
		projectId: string,
		totalFiles: number,
		source?: string
	): Promise<void> {
		const supabase = await createSupabaseServerClient();
		const { error } = await supabase
			.from("upload_batches")
			.insert({
				batch_id: batchId,
				project_id: projectId,
				total_files: totalFiles,
				status: 'processing',
				upload_source: source || 'auto-upload'
			});

		if (error) {
			console.error('Failed to create batch record:', error);
		}
	}

	/**
	 * Update batch record
	 */
	private async updateBatchRecord(batchId: string, updates: Record<string, unknown>): Promise<void> {
		const supabase = await createSupabaseServerClient();
		const { error } = await supabase
			.from("upload_batches")
			.update({
				...updates,
				updated_at: new Date().toISOString()
			})
			.eq("batch_id", batchId);

		if (error) {
			console.error('Failed to update batch record:', error);
		}
	}

	/**
	 * Get upload statistics for a project
	 */
	async getUploadStatistics(projectId: string): Promise<Record<string, unknown>> {
		const supabase = await createSupabaseServerClient();
		const { data, error } = await supabase
			.from("upload_statistics")
			.select("*")
			.eq("project_id", projectId)
			.single();

		if (error && error.code !== 'PGRST116') {
			throw new Error(`Failed to fetch statistics: ${error.message}`);
		}

		return data;
	}

	/**
	 * Get upload batch history
	 */
	async getUploadHistory(projectId: string, limit: number = 20): Promise<UploadBatch[]> {
		const supabase = await createSupabaseServerClient();
		const { data, error } = await supabase
			.from("upload_batches")
			.select("*")
			.eq("project_id", projectId)
			.order("created_at", { ascending: false })
			.limit(limit);

		if (error) {
			throw new Error(`Failed to fetch upload history: ${error.message}`);
		}

		return data || [];
	}

	/**
	 * Clean up old upload batches
	 */
	async cleanupOldBatches(): Promise<number> {
		const supabase = await createSupabaseServerClient();
		const { data, error } = await supabase
			.rpc('cleanup_old_upload_batches');

		if (error) {
			throw new Error(`Failed to cleanup old batches: ${error.message}`);
		}

		return data || 0;
	}
}

// Export singleton instance
export const autoUploadService = new AutoUploadService();
