/**
 * Migration Script: Generate Image Variants for Existing Images
 * 
 * This script processes all existing images in the database that don't have
 * thumbnail and preview variants, generates them, uploads to storage, and
 * updates the database records.
 * 
 * Usage: npx tsx scripts/migrate-existing-images.ts
 */

import { createClient } from '@supabase/supabase-js';
import { processImageVariants, buildVariantPath } from '../src/lib/image-processor';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
	console.error('❌ Missing required environment variables:');
	console.error('   - NEXT_PUBLIC_SUPABASE_URL');
	console.error('   - SUPABASE_SERVICE_ROLE_KEY');
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface ImageRecord {
	id: string;
	project_id: string;
	storage_path: string;
	thumbnail_path: string | null;
	preview_path: string | null;
	file_name: string;
}

interface ProjectBucket {
	project_id: string;
	storage_bucket: string;
}

async function migrateImage(image: ImageRecord, storageBucket: string): Promise<boolean> {
	try {
		console.log(`\n📸 Processing: ${image.file_name}`);
		
		// Download original image from storage
		console.log('  ⬇️  Downloading original...');
		const { data: originalData, error: downloadError } = await supabase.storage
			.from(storageBucket)
			.download(image.storage_path);
		
		if (downloadError || !originalData) {
			console.error(`  ❌ Failed to download: ${downloadError?.message}`);
			return false;
		}
		
		// Convert Blob to Buffer
		const arrayBuffer = await originalData.arrayBuffer();
		const originalBuffer = Buffer.from(arrayBuffer);
		
		// Extract timestamp from storage path
		const pathParts = image.storage_path.split('/');
		const filename = pathParts[pathParts.length - 1];
		const timestamp = parseInt(filename.split('.')[0]);
		
		if (isNaN(timestamp)) {
			console.error(`  ❌ Could not extract timestamp from: ${image.storage_path}`);
			return false;
		}
		
		// Generate variants
		console.log('  🖼️  Generating variants...');
		const { thumbnail, preview } = await processImageVariants(
			new File([originalBuffer], image.file_name, { type: 'image/jpeg' })
		);
		
		// Build storage paths
		const thumbnailPath = buildVariantPath(image.project_id, timestamp, 'thumbnail');
		const previewPath = buildVariantPath(image.project_id, timestamp, 'preview');
		
		// Upload variants
		console.log('  ⬆️  Uploading thumbnail...');
		const { error: thumbnailError } = await supabase.storage
			.from(storageBucket)
			.upload(thumbnailPath, thumbnail, {
				contentType: 'image/jpeg',
				cacheControl: '3600',
				upsert: true,
			});
		
		if (thumbnailError) {
			console.error(`  ⚠️  Thumbnail upload failed: ${thumbnailError.message}`);
		}
		
		console.log('  ⬆️  Uploading preview...');
		const { error: previewError } = await supabase.storage
			.from(storageBucket)
			.upload(previewPath, preview, {
				contentType: 'image/jpeg',
				cacheControl: '3600',
				upsert: true,
			});
		
		if (previewError) {
			console.error(`  ⚠️  Preview upload failed: ${previewError.message}`);
		}
		
		// Update database record
		console.log('  💾 Updating database...');
		const { error: updateError } = await supabase
			.from('images')
			.update({
				thumbnail_path: thumbnailError ? null : thumbnailPath,
				preview_path: previewError ? null : previewPath,
			})
			.eq('id', image.id);
		
		if (updateError) {
			console.error(`  ❌ Database update failed: ${updateError.message}`);
			return false;
		}
		
		console.log('  ✅ Successfully migrated!');
		return true;
	} catch (error) {
		console.error(`  ❌ Error processing image:`, error);
		return false;
	}
}

async function main() {
	console.log('🚀 Starting image variant migration...\n');
	
	// Get all images without variants
	console.log('📋 Fetching images needing migration...');
	const { data: images, error: fetchError } = await supabase
		.from('images')
		.select('id, project_id, storage_path, thumbnail_path, preview_path, file_name')
		.or('thumbnail_path.is.null,preview_path.is.null')
		.order('uploaded_at', { ascending: true });
	
	if (fetchError) {
		console.error('❌ Failed to fetch images:', fetchError.message);
		process.exit(1);
	}
	
	if (!images || images.length === 0) {
		console.log('✨ No images need migration. All done!');
		process.exit(0);
	}
	
	console.log(`📊 Found ${images.length} images to migrate\n`);
	
	// Get unique projects and their storage buckets
	const uniqueProjectIds = [...new Set(images.map(img => img.project_id))];
	console.log(`🗂️  Processing ${uniqueProjectIds.length} projects\n`);
	
	const projectBuckets: Record<string, string> = {};
	for (const projectId of uniqueProjectIds) {
		const { data: project } = await supabase
			.from('projects')
			.select('storage_bucket')
			.eq('id', projectId)
			.single();
		
		if (project?.storage_bucket) {
			projectBuckets[projectId] = project.storage_bucket;
		}
	}
	
	// Process images in batches
	const BATCH_SIZE = 10;
	let successCount = 0;
	let failCount = 0;
	
	for (let i = 0; i < images.length; i += BATCH_SIZE) {
		const batch = images.slice(i, i + BATCH_SIZE);
		console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(images.length / BATCH_SIZE)}`);
		console.log(`   Images ${i + 1}-${Math.min(i + BATCH_SIZE, images.length)} of ${images.length}`);
		
		const results = await Promise.all(
			batch.map(image => {
				const bucket = projectBuckets[image.project_id];
				if (!bucket) {
					console.error(`❌ No storage bucket found for project: ${image.project_id}`);
					return Promise.resolve(false);
				}
				return migrateImage(image, bucket);
			})
		);
		
		successCount += results.filter(r => r).length;
		failCount += results.filter(r => !r).length;
		
		// Add a small delay between batches to avoid overwhelming the server
		if (i + BATCH_SIZE < images.length) {
			console.log('\n⏳ Waiting 2 seconds before next batch...');
			await new Promise(resolve => setTimeout(resolve, 2000));
		}
	}
	
	console.log('\n' + '='.repeat(60));
	console.log('📊 Migration Summary:');
	console.log('   Total images:', images.length);
	console.log('   ✅ Successfully migrated:', successCount);
	console.log('   ❌ Failed:', failCount);
	console.log('='.repeat(60) + '\n');
	
	if (failCount > 0) {
		console.log('⚠️  Some images failed to migrate. Check the logs above for details.');
		process.exit(1);
	} else {
		console.log('🎉 All images successfully migrated!');
		process.exit(0);
	}
}

main().catch(error => {
	console.error('💥 Fatal error:', error);
	process.exit(1);
});

