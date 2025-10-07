-- Performance Optimization Migration
-- Run this in your Supabase SQL Editor to optimize existing queries and prepare for new features

-- ============================================================================
-- CRITICAL PERFORMANCE INDEXES FOR EXISTING SYSTEM
-- ============================================================================

-- Projects table optimizations
CREATE INDEX IF NOT EXISTS idx_projects_owner_created 
ON public.projects(owner, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_storage_bucket 
ON public.projects(storage_bucket) WHERE storage_bucket IS NOT NULL;

-- Images table optimizations (these are critical for dashboard performance)
CREATE INDEX IF NOT EXISTS idx_images_project_capture_time 
ON public.images(project_id, capture_time DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_images_project_uploaded 
ON public.images(project_id, uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_images_uploaded_at_desc 
ON public.images(uploaded_at DESC);

-- Collections table optimizations
CREATE INDEX IF NOT EXISTS idx_collections_project_created 
ON public.collections(project_id, created_at DESC);

-- Collection images optimizations
CREATE INDEX IF NOT EXISTS idx_collection_images_image_id 
ON public.collection_images(image_id);

-- ============================================================================
-- FOTOFLO AUTO UPLOAD FEATURE SCHEMA
-- ============================================================================

-- Linked folders table for auto-upload feature
CREATE TABLE IF NOT EXISTS public.linked_folders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    folder_path text NOT NULL,
    folder_name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    last_sync_at timestamptz,
    sync_status text DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error', 'offline')),
    error_message text,
    last_error_at timestamptz,
    
    -- Ensure unique folder paths per project
    UNIQUE(project_id, folder_path)
);

-- Upload queue table for managing file uploads
CREATE TABLE IF NOT EXISTS public.upload_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    linked_folder_id uuid REFERENCES public.linked_folders(id) ON DELETE CASCADE,
    file_path text NOT NULL,
    file_name text NOT NULL,
    file_size bigint,
    file_hash text, -- For duplicate detection
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'completed', 'failed', 'duplicate')),
    error_message text,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    created_at timestamptz DEFAULT now(),
    started_at timestamptz,
    completed_at timestamptz,
    
    -- Ensure unique file paths per project
    UNIQUE(project_id, file_path)
);

-- Performance indexes for Fotoflo Auto Upload
CREATE INDEX IF NOT EXISTS idx_linked_folders_project_id 
ON public.linked_folders(project_id);

CREATE INDEX IF NOT EXISTS idx_linked_folders_status 
ON public.linked_folders(project_id, sync_status) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_upload_queue_status 
ON public.upload_queue(status, created_at) WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_upload_queue_project_status 
ON public.upload_queue(project_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_upload_queue_file_hash 
ON public.upload_queue(file_hash) WHERE file_hash IS NOT NULL;

-- ============================================================================
-- WEBSITE MODE FEATURE SCHEMA
-- ============================================================================

-- Website mode configuration table
CREATE TABLE IF NOT EXISTS public.website_modes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    is_enabled boolean DEFAULT false,
    domain_type text DEFAULT 'subdomain' CHECK (domain_type IN ('subdomain', 'custom')),
    subdomain text,
    custom_domain text,
    expires_at timestamptz,
    last_activity_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
    -- Note: Unique constraints will be created as partial indexes below
);

-- Access codes table for website mode
CREATE TABLE IF NOT EXISTS public.access_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    code text NOT NULL, -- 4-digit numeric code
    asset_type text NOT NULL CHECK (asset_type IN ('image', 'collection')),
    asset_id uuid NOT NULL, -- references images.id or collections.id
    expires_at timestamptz,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    last_accessed_at timestamptz,
    access_count integer DEFAULT 0,
    
    -- Ensure unique codes per project
    UNIQUE(project_id, code)
);

-- Performance indexes for Website Mode
CREATE INDEX IF NOT EXISTS idx_website_modes_project_id 
ON public.website_modes(project_id);

-- Partial unique indexes for website_modes (ensures unique subdomains and custom domains)
CREATE UNIQUE INDEX IF NOT EXISTS idx_website_modes_subdomain_unique 
ON public.website_modes(subdomain) WHERE subdomain IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_website_modes_custom_domain_unique 
ON public.website_modes(custom_domain) WHERE custom_domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_website_modes_subdomain 
ON public.website_modes(subdomain) WHERE subdomain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_website_modes_custom_domain 
ON public.website_modes(custom_domain) WHERE custom_domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_website_modes_enabled 
ON public.website_modes(project_id, is_enabled) WHERE is_enabled = true;

CREATE INDEX IF NOT EXISTS idx_access_codes_lookup 
ON public.access_codes(code, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_access_codes_project_asset 
ON public.access_codes(project_id, asset_type, asset_id);

CREATE INDEX IF NOT EXISTS idx_access_codes_expires 
ON public.access_codes(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- ADDITIONAL PROJECT TABLE COLUMNS FOR NEW FEATURES
-- ============================================================================

-- Add columns to projects table for new features
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS active_image_path text,
ADD COLUMN IF NOT EXISTS qr_visibility_duration integer DEFAULT 0, -- minutes, 0 = never expires
ADD COLUMN IF NOT EXISTS qr_expires_on_click boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS website_mode_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_upload_enabled boolean DEFAULT false;

-- Add customization columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS font_color text DEFAULT '#333333',
ADD COLUMN IF NOT EXISTS logo_size integer DEFAULT 80,
ADD COLUMN IF NOT EXISTS logo_position_y integer DEFAULT -100,
ADD COLUMN IF NOT EXISTS text_content text,
ADD COLUMN IF NOT EXISTS font_size integer DEFAULT 16,
ADD COLUMN IF NOT EXISTS text_position_y integer DEFAULT 150,
ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS font_weight text DEFAULT '400';

-- Performance indexes for new project columns
CREATE INDEX IF NOT EXISTS idx_projects_website_mode 
ON public.projects(website_mode_enabled) WHERE website_mode_enabled = true;

CREATE INDEX IF NOT EXISTS idx_projects_auto_upload 
ON public.projects(auto_upload_enabled) WHERE auto_upload_enabled = true;

-- ============================================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- RLS for linked_folders
ALTER TABLE public.linked_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage linked folders"
    ON public.linked_folders FOR ALL
    TO authenticated
    USING (
        (SELECT owner FROM public.projects WHERE id = project_id) = auth.uid()
    )
    WITH CHECK (
        (SELECT owner FROM public.projects WHERE id = project_id) = auth.uid()
    );

-- RLS for upload_queue
ALTER TABLE public.upload_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage upload queue"
    ON public.upload_queue FOR ALL
    TO authenticated
    USING (
        (SELECT owner FROM public.projects WHERE id = project_id) = auth.uid()
    )
    WITH CHECK (
        (SELECT owner FROM public.projects WHERE id = project_id) = auth.uid()
    );

-- RLS for website_modes
ALTER TABLE public.website_modes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage website modes"
    ON public.website_modes FOR ALL
    TO authenticated
    USING (
        (SELECT owner FROM public.projects WHERE id = project_id) = auth.uid()
    )
    WITH CHECK (
        (SELECT owner FROM public.projects WHERE id = project_id) = auth.uid()
    );

-- Public read access for website modes (for public websites)
CREATE POLICY "Public can view enabled website modes"
    ON public.website_modes FOR SELECT
    TO anon
    USING (is_enabled = true);

-- RLS for access_codes
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage access codes"
    ON public.access_codes FOR ALL
    TO authenticated
    USING (
        (SELECT owner FROM public.projects WHERE id = project_id) = auth.uid()
    )
    WITH CHECK (
        (SELECT owner FROM public.projects WHERE id = project_id) = auth.uid()
    );

-- Public read access for access codes (for website mode)
CREATE POLICY "Public can view active access codes"
    ON public.access_codes FOR SELECT
    TO anon
    USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- ============================================================================
-- HELPER FUNCTIONS FOR NEW FEATURES
-- ============================================================================

-- Function to generate unique 4-digit access codes
CREATE OR REPLACE FUNCTION generate_access_code(p_project_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    new_code text;
    code_exists boolean;
BEGIN
    LOOP
        -- Generate a random 4-digit code
        new_code := LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
        
        -- Check if code already exists for this project
        SELECT EXISTS(
            SELECT 1 FROM public.access_codes 
            WHERE project_id = p_project_id AND code = new_code
        ) INTO code_exists;
        
        -- Exit loop if code is unique
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$;

-- Function to clean up expired access codes
CREATE OR REPLACE FUNCTION cleanup_expired_access_codes()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.access_codes 
    SET is_active = false 
    WHERE expires_at IS NOT NULL 
    AND expires_at < now() 
    AND is_active = true;
END;
$$;

-- Function to update website mode activity
CREATE OR REPLACE FUNCTION update_website_mode_activity(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.website_modes 
    SET last_activity_at = now(),
        updated_at = now()
    WHERE project_id = p_project_id 
    AND is_enabled = true;
END;
$$;

-- Function to update linked folder sync status
CREATE OR REPLACE FUNCTION update_linked_folder_status(
    p_folder_id uuid,
    p_status text,
    p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.linked_folders 
    SET sync_status = p_status,
        error_message = p_error_message,
        last_error_at = CASE WHEN p_error_message IS NOT NULL THEN now() ELSE last_error_at END,
        last_sync_at = CASE WHEN p_status = 'idle' THEN now() ELSE last_sync_at END
    WHERE id = p_folder_id;
END;
$$;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Trigger to update website_modes updated_at
CREATE TRIGGER update_website_modes_updated_at 
    BEFORE UPDATE ON public.website_modes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update access code access count
CREATE OR REPLACE FUNCTION update_access_code_stats()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_accessed_at = now();
    NEW.access_count = OLD.access_count + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Note: This trigger will be created when we implement the access code usage tracking

-- ============================================================================
-- PERFORMANCE OPTIMIZATION QUERIES
-- ============================================================================

-- Create a materialized view for dashboard performance
CREATE MATERIALIZED VIEW IF NOT EXISTS project_dashboard_stats AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.owner,
    p.created_at as project_created_at,
    p.display_mode,
    p.website_mode_enabled,
    p.auto_upload_enabled,
    
    -- Image statistics
    COUNT(DISTINCT i.id) as total_images,
    MAX(i.uploaded_at) as latest_image_upload,
    MAX(i.capture_time) as latest_capture_time,
    
    -- Collection statistics
    COUNT(DISTINCT c.id) as total_collections,
    COUNT(DISTINCT CASE WHEN c.is_active THEN c.id END) as active_collections,
    MAX(c.created_at) as latest_collection_created,
    
    -- Linked folder statistics
    COUNT(DISTINCT lf.id) as total_linked_folders,
    COUNT(DISTINCT CASE WHEN lf.is_active THEN lf.id END) as active_linked_folders,
    MAX(lf.last_sync_at) as latest_sync,
    
    -- Upload queue statistics
    COUNT(DISTINCT CASE WHEN uq.status = 'pending' THEN uq.id END) as pending_uploads,
    COUNT(DISTINCT CASE WHEN uq.status = 'failed' THEN uq.id END) as failed_uploads,
    
    -- Website mode statistics
    wm.subdomain,
    wm.custom_domain,
    wm.expires_at as website_expires_at,
    wm.last_activity_at as website_last_activity

FROM public.projects p
LEFT JOIN public.images i ON p.id = i.project_id
LEFT JOIN public.collections c ON p.id = c.project_id
LEFT JOIN public.linked_folders lf ON p.id = lf.project_id
LEFT JOIN public.upload_queue uq ON p.id = uq.project_id
LEFT JOIN public.website_modes wm ON p.id = wm.project_id AND wm.is_enabled = true
GROUP BY p.id, p.name, p.owner, p.created_at, p.display_mode, p.website_mode_enabled, p.auto_upload_enabled,
         wm.subdomain, wm.custom_domain, wm.expires_at, wm.last_activity_at;

-- Create index on materialized view for fast dashboard queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_dashboard_stats_project_id 
ON project_dashboard_stats(project_id);

CREATE INDEX IF NOT EXISTS idx_project_dashboard_stats_owner 
ON project_dashboard_stats(owner, project_created_at DESC);

-- Function to refresh dashboard stats
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY project_dashboard_stats;
END;
$$;

-- ============================================================================
-- CLEANUP AND MAINTENANCE
-- ============================================================================

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Clean up expired access codes
    PERFORM cleanup_expired_access_codes();
    
    -- Clean up old failed uploads (older than 30 days)
    DELETE FROM public.upload_queue 
    WHERE status = 'failed' 
    AND created_at < now() - interval '30 days';
    
    -- Clean up old completed uploads (older than 90 days)
    DELETE FROM public.upload_queue 
    WHERE status = 'completed' 
    AND completed_at < now() - interval '90 days';
END;
$$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.linked_folders IS 'Stores folders linked for automatic upload in Fotoflo Auto Upload feature';
COMMENT ON TABLE public.upload_queue IS 'Manages file upload queue for automatic uploads with retry logic';
COMMENT ON TABLE public.website_modes IS 'Configuration for Website Mode feature allowing public websites';
COMMENT ON TABLE public.access_codes IS '4-digit access codes for Website Mode public access';

COMMENT ON FUNCTION generate_access_code(uuid) IS 'Generates unique 4-digit access codes for website mode';
COMMENT ON FUNCTION cleanup_expired_access_codes() IS 'Deactivates expired access codes';
COMMENT ON FUNCTION update_website_mode_activity(uuid) IS 'Updates last activity timestamp for website mode';
COMMENT ON FUNCTION update_linked_folder_status(uuid, text, text) IS 'Updates sync status and error messages for linked folders';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- This migration adds:
-- 1. Critical performance indexes for existing system
-- 2. Complete schema for Fotoflo Auto Upload feature
-- 3. Complete schema for Website Mode feature
-- 4. Helper functions and triggers
-- 5. Materialized view for dashboard performance
-- 6. RLS policies for security
-- 7. Cleanup and maintenance functions
