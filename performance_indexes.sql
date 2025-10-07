-- Database performance optimization indexes
-- Run these in your Supabase SQL editor

-- Images table indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_images_project_id ON images(project_id);
CREATE INDEX IF NOT EXISTS idx_images_capture_time ON images(capture_time DESC);
CREATE INDEX IF NOT EXISTS idx_images_uploaded_at ON images(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_collection_id ON images(collection_id);

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner);
CREATE INDEX IF NOT EXISTS idx_projects_storage_bucket ON projects(storage_bucket);

-- Collections table indexes
CREATE INDEX IF NOT EXISTS idx_collections_project_id ON collections(project_id);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at DESC);

-- Sync folders table indexes
CREATE INDEX IF NOT EXISTS idx_sync_folders_project_id ON sync_folders(project_id);
CREATE INDEX IF NOT EXISTS idx_sync_folders_active ON sync_folders(active);

-- Upload batches table indexes
CREATE INDEX IF NOT EXISTS idx_upload_batches_project_id ON upload_batches(project_id);
CREATE INDEX IF NOT EXISTS idx_upload_batches_created_at ON upload_batches(created_at DESC);

-- Auto upload config table indexes
CREATE INDEX IF NOT EXISTS idx_auto_upload_config_project_id ON auto_upload_config(project_id);
