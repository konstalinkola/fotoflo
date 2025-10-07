-- Add collection_id column to images table
-- Run this in your Supabase SQL Editor

ALTER TABLE images 
ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'images' 
AND column_name = 'collection_id';
