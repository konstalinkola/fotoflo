-- Add image variant paths to images table for optimized loading
-- This migration adds columns to store paths for thumbnail and preview variants

ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS thumbnail_path TEXT,
ADD COLUMN IF NOT EXISTS preview_path TEXT;

-- Add indexes for faster queries on variant paths
CREATE INDEX IF NOT EXISTS idx_images_thumbnail_path ON public.images(thumbnail_path);
CREATE INDEX IF NOT EXISTS idx_images_preview_path ON public.images(preview_path);

-- Add comments explaining the new fields
COMMENT ON COLUMN public.images.thumbnail_path IS 'Path to 240x240px thumbnail variant (JPEG 80% quality, ~5-15KB) for grid galleries';
COMMENT ON COLUMN public.images.preview_path IS 'Path to 1200px wide preview variant (JPEG 85% quality, ~100-300KB) for lightboxes';
COMMENT ON COLUMN public.images.storage_path IS 'Path to original full-resolution image (for downloads only)';

