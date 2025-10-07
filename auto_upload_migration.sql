-- Fotoflo Auto Upload Backend API Database Migration
-- This migration adds tables and columns to support auto upload functionality

-- Create auto_upload_config table
CREATE TABLE IF NOT EXISTS auto_upload_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    auto_organize BOOLEAN DEFAULT true,
    duplicate_detection BOOLEAN DEFAULT true,
    max_file_size INTEGER DEFAULT 10485760, -- 10MB in bytes
    allowed_formats TEXT[] DEFAULT ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    webhook_url TEXT,
    webhook_secret TEXT,
    auto_collection_creation BOOLEAN DEFAULT true,
    collection_naming_pattern TEXT DEFAULT 'Auto Upload {date}',
    background_processing BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id)
);

-- Create upload_batches table for tracking batch uploads
CREATE TABLE IF NOT EXISTS upload_batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id TEXT NOT NULL UNIQUE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    total_files INTEGER NOT NULL DEFAULT 0,
    successful_uploads INTEGER NOT NULL DEFAULT 0,
    failed_uploads INTEGER NOT NULL DEFAULT 0,
    duplicates_skipped INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    upload_source TEXT DEFAULT 'manual',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(batch_id, project_id)
);

-- Add new columns to existing images table to support auto upload features
DO $$ 
BEGIN
    -- Add file_hash column for duplicate detection
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'images' AND column_name = 'file_hash') THEN
        ALTER TABLE images ADD COLUMN file_hash TEXT;
        CREATE INDEX IF NOT EXISTS idx_images_file_hash ON images(file_hash);
        CREATE INDEX IF NOT EXISTS idx_images_project_hash ON images(project_id, file_hash);
    END IF;

    -- Add upload_batch_id column to track which batch an image came from
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'images' AND column_name = 'upload_batch_id') THEN
        ALTER TABLE images ADD COLUMN upload_batch_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_images_upload_batch ON images(upload_batch_id);
    END IF;

    -- Add upload_source column to track upload method
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'images' AND column_name = 'upload_source') THEN
        ALTER TABLE images ADD COLUMN upload_source TEXT DEFAULT 'manual';
        CREATE INDEX IF NOT EXISTS idx_images_upload_source ON images(upload_source);
    END IF;

    -- Add original_name column to preserve original filename
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'images' AND column_name = 'original_name') THEN
        ALTER TABLE images ADD COLUMN original_name TEXT;
    END IF;

    -- Add external_metadata column for webhook metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'images' AND column_name = 'external_metadata') THEN
        ALTER TABLE images ADD COLUMN external_metadata JSONB;
    END IF;

    -- Add collection_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'images' AND column_name = 'collection_id') THEN
        ALTER TABLE images ADD COLUMN collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_images_collection_id ON images(collection_id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auto_upload_config_project ON auto_upload_config(project_id);
CREATE INDEX IF NOT EXISTS idx_upload_batches_project ON upload_batches(project_id);
CREATE INDEX IF NOT EXISTS idx_upload_batches_status ON upload_batches(status);
CREATE INDEX IF NOT EXISTS idx_upload_batches_created_at ON upload_batches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_uploaded_at ON images(uploaded_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_auto_upload_config_updated_at ON auto_upload_config;
CREATE TRIGGER update_auto_upload_config_updated_at
    BEFORE UPDATE ON auto_upload_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_upload_batches_updated_at ON upload_batches;
CREATE TRIGGER update_upload_batches_updated_at
    BEFORE UPDATE ON upload_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for upload statistics
CREATE OR REPLACE VIEW upload_statistics AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.owner,
    COUNT(DISTINCT ub.batch_id) as total_batches,
    COALESCE(SUM(ub.total_files), 0) as total_files_attempted,
    COALESCE(SUM(ub.successful_uploads), 0) as total_successful_uploads,
    COALESCE(SUM(ub.failed_uploads), 0) as total_failed_uploads,
    COALESCE(SUM(ub.duplicates_skipped), 0) as total_duplicates_skipped,
    CASE 
        WHEN COALESCE(SUM(ub.total_files), 0) > 0 
        THEN ROUND((COALESCE(SUM(ub.successful_uploads), 0)::DECIMAL / COALESCE(SUM(ub.total_files), 0)) * 100, 2)
        ELSE 0
    END as success_rate_percentage,
    MAX(ub.created_at) as last_upload_at,
    auc.auto_organize,
    auc.duplicate_detection,
    auc.webhook_url IS NOT NULL as webhook_configured
FROM projects p
LEFT JOIN upload_batches ub ON p.id = ub.project_id
LEFT JOIN auto_upload_config auc ON p.id = auc.project_id
GROUP BY p.id, p.name, p.owner, auc.auto_organize, auc.duplicate_detection, auc.webhook_url;

-- Create function to clean up old upload batches (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_upload_batches()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM upload_batches 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND status IN ('completed', 'failed', 'cancelled');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get upload progress for a batch
CREATE OR REPLACE FUNCTION get_batch_upload_progress(batch_id_param TEXT)
RETURNS TABLE (
    batch_id TEXT,
    project_id UUID,
    total_files INTEGER,
    successful_uploads INTEGER,
    failed_uploads INTEGER,
    duplicates_skipped INTEGER,
    progress_percentage DECIMAL,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ub.batch_id,
        ub.project_id,
        ub.total_files,
        ub.successful_uploads,
        ub.failed_uploads,
        ub.duplicates_skipped,
        CASE 
            WHEN ub.total_files > 0 
            THEN ROUND(((ub.successful_uploads + ub.failed_uploads + ub.duplicates_skipped)::DECIMAL / ub.total_files) * 100, 2)
            ELSE 0
        END as progress_percentage,
        ub.status,
        ub.created_at,
        ub.completed_at
    FROM upload_batches ub
    WHERE ub.batch_id = batch_id_param;
END;
$$ LANGUAGE plpgsql;

-- Insert sample auto upload config for existing projects (optional)
-- Uncomment the following if you want to enable auto upload for all existing projects
/*
INSERT INTO auto_upload_config (project_id, auto_organize, duplicate_detection, max_file_size, allowed_formats, auto_collection_creation, collection_naming_pattern, background_processing)
SELECT 
    id as project_id,
    true as auto_organize,
    true as duplicate_detection,
    10485760 as max_file_size,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as allowed_formats,
    true as auto_collection_creation,
    'Auto Upload {date}' as collection_naming_pattern,
    true as background_processing
FROM projects
WHERE id NOT IN (SELECT project_id FROM auto_upload_config);
*/

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON auto_upload_config TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON upload_batches TO authenticated;
-- GRANT SELECT ON upload_statistics TO authenticated;

COMMENT ON TABLE auto_upload_config IS 'Configuration for auto upload features per project';
COMMENT ON TABLE upload_batches IS 'Tracks batch upload operations and their status';
COMMENT ON VIEW upload_statistics IS 'Aggregated statistics for upload operations across projects';
COMMENT ON FUNCTION cleanup_old_upload_batches() IS 'Removes upload batch records older than 30 days';
COMMENT ON FUNCTION get_batch_upload_progress(TEXT) IS 'Returns upload progress information for a specific batch';
