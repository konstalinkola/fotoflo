-- =====================================================
-- Fotoflo Complete Database Schema
-- Optimized for Web + Desktop App Integration
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Projects table (enhanced for desktop app support)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    
    -- Storage configuration
    storage_bucket TEXT NOT NULL DEFAULT 'photos',
    storage_prefix TEXT,
    
    -- QR code management
    active_image_path TEXT,
    qr_visibility_duration INTEGER DEFAULT 0, -- 0 = forever, >0 = minutes
    qr_expires_on_click BOOLEAN DEFAULT false,
    
    -- Display mode (single image vs collection)
    display_mode TEXT DEFAULT 'single' CHECK (display_mode IN ('single', 'collection')),
    
    -- Public page customization (individual columns for better performance)
    logo_url TEXT,
    background_color TEXT DEFAULT '#ffffff',
    logo_size INTEGER DEFAULT 80,
    logo_position_y INTEGER DEFAULT -100,
    text_content TEXT,
    text_position_y INTEGER DEFAULT 150,
    font_color TEXT DEFAULT '#333333',
    font_size INTEGER DEFAULT 16,
    font_family TEXT DEFAULT 'Inter',
    font_weight TEXT DEFAULT '400',
    
    -- Desktop app specific fields
    desktop_sync_enabled BOOLEAN DEFAULT false,
    watch_folder_path TEXT, -- Local folder path for desktop app monitoring
    auto_upload_enabled BOOLEAN DEFAULT true,
    
    -- Legacy fields (for backward compatibility)
    google_drive_folder_id TEXT,
    google_drive_refresh_token TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Images table (enhanced for desktop app and all variants)
CREATE TABLE IF NOT EXISTS public.images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- File information
    file_name TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    original_extension TEXT, -- Keep original extension for desktop app
    
    -- Storage paths for all variants (optimized image serving)
    storage_path TEXT NOT NULL,
    micro_path TEXT, -- 120x120px for ultra-fast grid loading
    thumbnail_path TEXT, -- 240x240px for gallery previews
    preview_path TEXT, -- 1200px for lightbox/full view
    
    -- EXIF data (extracted during upload)
    capture_time TIMESTAMPTZ,
    camera_make TEXT,
    camera_model TEXT,
    lens_model TEXT,
    focal_length REAL,
    aperture REAL,
    shutter_speed TEXT,
    iso INTEGER,
    flash BOOLEAN,
    width INTEGER,
    height INTEGER,
    gps_latitude REAL,
    gps_longitude REAL,
    gps_altitude REAL,
    
    -- Desktop app specific fields
    local_file_path TEXT, -- Original local path for desktop app
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'failed')),
    last_sync_at TIMESTAMPTZ,
    
    -- Timestamps
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Collections table (for collection mode projects)
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    collection_number INTEGER NOT NULL,
    name TEXT, -- Optional collection name
    is_active BOOLEAN DEFAULT false, -- Active collection for QR display
    
    -- Desktop app fields
    created_via_desktop BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(project_id, collection_number)
);

-- Collection images junction table
CREATE TABLE IF NOT EXISTS public.collection_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
    image_id UUID REFERENCES public.images(id) ON DELETE CASCADE,
    
    -- Order within collection
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(collection_id, image_id)
);

-- =====================================================
-- DESKTOP APP SUPPORT TABLES
-- =====================================================

-- Desktop app sessions (for tracking desktop app connections)
CREATE TABLE IF NOT EXISTS public.desktop_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    device_id TEXT UNIQUE NOT NULL, -- Unique device identifier
    app_version TEXT,
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Desktop app sync logs (for debugging and monitoring)
CREATE TABLE IF NOT EXISTS public.sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    desktop_session_id UUID REFERENCES public.desktop_sessions(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'upload', 'delete', 'update'
    file_path TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success', 'failed', 'pending'
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- QR CODE AND DELIVERY SYSTEM
-- =====================================================

-- QR code deliveries (for tracking and analytics)
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
    image_id UUID REFERENCES public.images(id) ON DELETE SET NULL,
    
    -- Delivery details
    qr_code TEXT UNIQUE NOT NULL,
    short_url TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ,
    max_views INTEGER,
    current_views INTEGER DEFAULT 0,
    
    -- Analytics
    first_viewed_at TIMESTAMPTZ,
    last_viewed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Delivery views (for analytics)
CREATE TABLE IF NOT EXISTS public.delivery_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
    
    -- View details
    ip_address INET,
    user_agent TEXT,
    referer TEXT,
    country TEXT,
    
    -- Timestamps
    viewed_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_display_mode ON public.projects(display_mode);
CREATE INDEX IF NOT EXISTS idx_projects_desktop_sync ON public.projects(desktop_sync_enabled) WHERE desktop_sync_enabled = true;

-- Images indexes
CREATE INDEX IF NOT EXISTS idx_images_project_id ON public.images(project_id);
CREATE INDEX IF NOT EXISTS idx_images_capture_time ON public.images(capture_time);
CREATE INDEX IF NOT EXISTS idx_images_uploaded_at ON public.images(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_images_sync_status ON public.images(sync_status);
CREATE INDEX IF NOT EXISTS idx_images_micro_path ON public.images(micro_path) WHERE micro_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_images_thumbnail_path ON public.images(thumbnail_path) WHERE thumbnail_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_images_preview_path ON public.images(preview_path) WHERE preview_path IS NOT NULL;

-- Collections indexes
CREATE INDEX IF NOT EXISTS idx_collections_project_id ON public.collections(project_id);
CREATE INDEX IF NOT EXISTS idx_collections_collection_number ON public.collections(collection_number);
CREATE INDEX IF NOT EXISTS idx_collections_project_collection ON public.collections(project_id, collection_number);
CREATE INDEX IF NOT EXISTS idx_collections_active ON public.collections(is_active) WHERE is_active = true;

-- Collection images indexes
CREATE INDEX IF NOT EXISTS idx_collection_images_collection_id ON public.collection_images(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_images_image_id ON public.collection_images(image_id);
CREATE INDEX IF NOT EXISTS idx_collection_images_sort_order ON public.collection_images(collection_id, sort_order);

-- Desktop app indexes
CREATE INDEX IF NOT EXISTS idx_desktop_sessions_user_id ON public.desktop_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_desktop_sessions_device_id ON public.desktop_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_desktop_sessions_active ON public.desktop_sessions(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_sync_logs_session_id ON public.sync_logs(desktop_session_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_project_id ON public.sync_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON public.sync_logs(created_at);

-- Delivery indexes
CREATE INDEX IF NOT EXISTS idx_deliveries_project_id ON public.deliveries(project_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_qr_code ON public.deliveries(qr_code);
CREATE INDEX IF NOT EXISTS idx_deliveries_short_url ON public.deliveries(short_url);
CREATE INDEX IF NOT EXISTS idx_deliveries_expires_at ON public.deliveries(expires_at);

CREATE INDEX IF NOT EXISTS idx_delivery_views_delivery_id ON public.delivery_views(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_views_viewed_at ON public.delivery_views(viewed_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desktop_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_views ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Projects policies
CREATE POLICY "Users can manage own projects" ON public.projects
    FOR ALL TO authenticated
    USING (auth.uid() = owner)
    WITH CHECK (auth.uid() = owner);

CREATE POLICY "Public read access for projects" ON public.projects
    FOR SELECT TO anon
    USING (true);

-- Images policies
CREATE POLICY "Users can manage project images" ON public.images
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = images.project_id 
            AND projects.owner = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = images.project_id 
            AND projects.owner = auth.uid()
        )
    );

CREATE POLICY "Public read access for images" ON public.images
    FOR SELECT TO anon
    USING (true);

-- Collections policies
CREATE POLICY "Users can manage project collections" ON public.collections
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = collections.project_id 
            AND projects.owner = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = collections.project_id 
            AND projects.owner = auth.uid()
        )
    );

CREATE POLICY "Public read access for collections" ON public.collections
    FOR SELECT TO anon
    USING (true);

-- Collection images policies
CREATE POLICY "Users can manage collection images" ON public.collection_images
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.collections c ON c.project_id = p.id
            WHERE c.id = collection_images.collection_id 
            AND p.owner = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.collections c ON c.project_id = p.id
            WHERE c.id = collection_images.collection_id 
            AND p.owner = auth.uid()
        )
    );

CREATE POLICY "Public read access for collection images" ON public.collection_images
    FOR SELECT TO anon
    USING (true);

-- Desktop sessions policies
CREATE POLICY "Users can manage own desktop sessions" ON public.desktop_sessions
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Sync logs policies
CREATE POLICY "Users can view own sync logs" ON public.sync_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.desktop_sessions ds
            WHERE ds.id = sync_logs.desktop_session_id 
            AND ds.user_id = auth.uid()
        )
    );

-- Deliveries policies
CREATE POLICY "Users can manage project deliveries" ON public.deliveries
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = deliveries.project_id 
            AND projects.owner = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = deliveries.project_id 
            AND projects.owner = auth.uid()
        )
    );

CREATE POLICY "Public read access for deliveries" ON public.deliveries
    FOR SELECT TO anon
    USING (true);

-- Delivery views policies (public can insert, users can view their own)
CREATE POLICY "Anyone can record delivery views" ON public.delivery_views
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Users can view own delivery analytics" ON public.delivery_views
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.deliveries d
            JOIN public.projects p ON p.id = d.project_id
            WHERE d.id = delivery_views.delivery_id 
            AND p.owner = auth.uid()
        )
    );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_desktop_sessions_updated_at BEFORE UPDATE ON public.desktop_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate short URLs
CREATE OR REPLACE FUNCTION generate_short_url()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ language 'plpgsql';

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.projects IS 'Main projects table with customization and desktop app support';
COMMENT ON TABLE public.images IS 'Images with all variants (micro, thumbnail, preview) for optimized serving';
COMMENT ON TABLE public.collections IS 'Collections for grouping images in collection mode';
COMMENT ON TABLE public.collection_images IS 'Junction table for collection-image relationships';
COMMENT ON TABLE public.desktop_sessions IS 'Desktop app session tracking and device management';
COMMENT ON TABLE public.sync_logs IS 'Desktop app sync operation logs for debugging';
COMMENT ON TABLE public.deliveries IS 'QR code and delivery system for sharing images';
COMMENT ON TABLE public.delivery_views IS 'Analytics for delivery views and interactions';

COMMENT ON COLUMN public.projects.desktop_sync_enabled IS 'Whether desktop app can sync to this project';
COMMENT ON COLUMN public.projects.watch_folder_path IS 'Local folder path for desktop app to monitor';
COMMENT ON COLUMN public.images.micro_path IS '120x120px variant for ultra-fast grid loading (5-15KB)';
COMMENT ON COLUMN public.images.thumbnail_path IS '240x240px variant for gallery previews (15-30KB)';
COMMENT ON COLUMN public.images.preview_path IS '1200px variant for lightbox/full view (100-200KB)';
COMMENT ON COLUMN public.images.sync_status IS 'Desktop app sync status: pending, syncing, synced, failed';
COMMENT ON COLUMN public.deliveries.qr_code IS 'Unique QR code identifier for sharing';
COMMENT ON COLUMN public.deliveries.short_url IS 'Short URL for easy sharing without QR codes';

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================

-- Note: No sample data included - this is a clean schema for fresh deployment
-- Sample data can be added after deployment for testing purposes


