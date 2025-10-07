-- Add collection_id column to images table
ALTER TABLE images 
ADD COLUMN collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;
