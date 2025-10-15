import sharp from 'sharp';

/**
 * Image variant configuration - optimized for minimal resource usage
 */
export const IMAGE_VARIANTS = {
	// Micro thumbnails for grid views (5-15KB)
	MICRO: {
		width: 120,
		height: 120,
		quality: 70,
		fit: 'cover' as const,
	},
	// Thumbnails for gallery previews (15-30KB)
	THUMBNAIL: {
		width: 240,
		height: 240,
		quality: 80,
		fit: 'cover' as const,
	},
	// Previews for lightbox (100-200KB)
	PREVIEW: {
		width: 1200,
		quality: 85,
	},
	// Original for downloads only (high quality)
	ORIGINAL: {
		quality: 95,
	},
} as const;

/**
 * Generate a micro thumbnail variant (120x120px, JPEG 70% quality)
 * Used for grid galleries - typically 5-15KB
 * 
 * @param buffer - Original image buffer
 * @returns Micro thumbnail image buffer
 */
export async function generateMicroThumbnail(buffer: Buffer): Promise<Buffer> {
	return sharp(buffer)
		.resize(IMAGE_VARIANTS.MICRO.width, IMAGE_VARIANTS.MICRO.height, {
			fit: IMAGE_VARIANTS.MICRO.fit,
			position: 'center',
		})
		.jpeg({ quality: IMAGE_VARIANTS.MICRO.quality })
		.toBuffer();
}

/**
 * Generate a thumbnail variant (240x240px, JPEG 80% quality)
 * Used for gallery previews - typically 15-30KB
 * 
 * @param buffer - Original image buffer
 * @returns Thumbnail image buffer
 */
export async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
	return sharp(buffer)
		.resize(IMAGE_VARIANTS.THUMBNAIL.width, IMAGE_VARIANTS.THUMBNAIL.height, {
			fit: IMAGE_VARIANTS.THUMBNAIL.fit,
			position: 'center',
		})
		.jpeg({ quality: IMAGE_VARIANTS.THUMBNAIL.quality })
		.toBuffer();
}

/**
 * Generate a preview variant (1200px wide, JPEG 85% quality)
 * Used for lightboxes and public page displays - typically 100-200KB
 * 
 * @param buffer - Original image buffer
 * @returns Preview image buffer
 */
export async function generatePreview(buffer: Buffer): Promise<Buffer> {
	return sharp(buffer)
		.resize(IMAGE_VARIANTS.PREVIEW.width, null, {
			withoutEnlargement: true,
		})
		.jpeg({ quality: IMAGE_VARIANTS.PREVIEW.quality })
		.toBuffer();
}

/**
 * Optimize original image (JPEG 95% quality)
 * Used for downloads - maintains high quality while reducing file size
 * 
 * @param buffer - Original image buffer
 * @returns Optimized original image buffer
 */
export async function optimizeOriginal(buffer: Buffer): Promise<Buffer> {
	return sharp(buffer)
		.jpeg({ quality: IMAGE_VARIANTS.ORIGINAL.quality })
		.toBuffer();
}

/**
 * Process all image variants from a File object
 * Generates micro, thumbnail, preview, and optimized original variants
 * 
 * @param file - Original file uploaded by user
 * @returns Object containing all four variants as buffers
 */
export async function processImageVariants(file: File): Promise<{
	original: Buffer;
	micro: Buffer;
	thumbnail: Buffer;
	preview: Buffer;
}> {
	// Convert File to Buffer
	const arrayBuffer = await file.arrayBuffer();
	const originalBuffer = Buffer.from(arrayBuffer);

	// Generate all variants in parallel for speed
	const [micro, thumbnail, preview, optimizedOriginal] = await Promise.all([
		generateMicroThumbnail(originalBuffer),
		generateThumbnail(originalBuffer),
		generatePreview(originalBuffer),
		optimizeOriginal(originalBuffer),
	]);

	return {
		original: optimizedOriginal,
		micro,
		thumbnail,
		preview,
	};
}

/**
 * Get the appropriate subdirectory name for a variant type
 */
export function getVariantSubdirectory(variant: 'micro' | 'thumbnail' | 'preview'): string {
	return `${variant}s`;
}

/**
 * Build storage path for an image variant
 * 
 * @param projectId - Project ID
 * @param timestamp - File timestamp
 * @param variant - Variant type ('micro' | 'thumbnail' | 'preview' | 'original')
 * @returns Storage path for the variant
 */
export function buildVariantPath(
	projectId: string,
	timestamp: number,
	variant: 'micro' | 'thumbnail' | 'preview' | 'original'
): string {
	// Variants are always JPEG, originals keep their extension
	const filename = `${timestamp}.jpg`;
	
	if (variant === 'original') {
		// Original files go in the project root with their original extension
		// This will be handled separately in the upload endpoint
		return `${projectId}/${timestamp}`;
	}
	
	// All variants go in subdirectories
	return `${projectId}/${getVariantSubdirectory(variant)}/${filename}`;
}

/**
 * Generate public URL for optimized image serving (zero egress cost)
 * 
 * @param supabaseUrl - Supabase project URL
 * @param bucket - Storage bucket name
 * @param path - Image path
 * @returns Public URL for direct access
 */
export function getPublicImageUrl(supabaseUrl: string, bucket: string, path: string): string {
	return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Generate optimized image URLs for all variants
 * 
 * @param supabaseUrl - Supabase project URL
 * @param bucket - Storage bucket name
 * @param projectId - Project ID
 * @param timestamp - Image timestamp
 * @returns Object with URLs for all image variants
 */
export function getOptimizedImageUrls(
	supabaseUrl: string,
	bucket: string,
	projectId: string,
	timestamp: number
): {
	original: string;
	micro: string;
	thumbnail: string;
	preview: string;
} {
	return {
		original: getPublicImageUrl(supabaseUrl, bucket, `${projectId}/${timestamp}.jpg`),
		micro: getPublicImageUrl(supabaseUrl, bucket, buildVariantPath(projectId, timestamp, 'micro')),
		thumbnail: getPublicImageUrl(supabaseUrl, bucket, buildVariantPath(projectId, timestamp, 'thumbnail')),
		preview: getPublicImageUrl(supabaseUrl, bucket, buildVariantPath(projectId, timestamp, 'preview')),
	};
}

