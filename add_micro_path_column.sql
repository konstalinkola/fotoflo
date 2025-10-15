-- Add micro_path column to images table for micro thumbnails
-- This supports the new micro thumbnail variant (120x120px) for ultra-low bandwidth usage

ALTER TABLE images 
ADD COLUMN IF NOT EXISTS micro_path TEXT;

-- Add comment explaining the new field
COMMENT ON COLUMN images.micro_path IS 'Path to the micro thumbnail variant (120x120px) for grid display - typically 5-15KB';

-- Update existing images to have micro_path if thumbnail_path exists
-- This allows existing images to benefit from micro thumbnails
UPDATE images 
SET micro_path = REPLACE(thumbnail_path, '/thumbnails/', '/micros/')
WHERE thumbnail_path IS NOT NULL 
  AND micro_path IS NULL;

-- Create index on micro_path for faster queries
CREATE INDEX IF NOT EXISTS idx_images_micro_path ON images(micro_path) WHERE micro_path IS NOT NULL;
