-- Collections Feature Database Migration
-- Run this in your Supabase SQL Editor

-- Add mode column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS display_mode text DEFAULT 'single' CHECK (display_mode IN ('single', 'collection'));

-- Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    collection_number integer NOT NULL,
    is_active boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Ensure unique collection numbers per project
    UNIQUE(project_id, collection_number)
);

-- Create collection_images junction table (many-to-many between collections and images)
CREATE TABLE IF NOT EXISTS public.collection_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id uuid REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
    image_id uuid REFERENCES public.images(id) ON DELETE CASCADE NOT NULL,
    sort_order integer DEFAULT 0,
    added_at timestamptz DEFAULT now(),
    
    -- Ensure unique image per collection
    UNIQUE(collection_id, image_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_collections_project_id ON public.collections(project_id);
CREATE INDEX IF NOT EXISTS idx_collections_active ON public.collections(project_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_collection_images_collection_id ON public.collection_images(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_images_sort_order ON public.collection_images(collection_id, sort_order);

-- RLS Policies for collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage collections"
    ON public.collections FOR ALL
    TO authenticated
    USING (
        (SELECT owner FROM public.projects WHERE id = project_id) = auth.uid()
    )
    WITH CHECK (
        (SELECT owner FROM public.projects WHERE id = project_id) = auth.uid()
    );

-- Public read access for collections (for QR code scanning)
CREATE POLICY "Public can view active collections"
    ON public.collections FOR SELECT
    TO anon
    USING (is_active = true);

-- RLS Policies for collection_images
ALTER TABLE public.collection_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage collection images"
    ON public.collection_images FOR ALL
    TO authenticated
    USING (
        (SELECT p.owner FROM public.projects p 
         JOIN public.collections c ON c.project_id = p.id 
         WHERE c.id = collection_id) = auth.uid()
    )
    WITH CHECK (
        (SELECT p.owner FROM public.projects p 
         JOIN public.collections c ON c.project_id = p.id 
         WHERE c.id = collection_id) = auth.uid()
    );

-- Public read access for collection images (for QR code scanning)
CREATE POLICY "Public can view collection images"
    ON public.collection_images FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM public.collections c 
            WHERE c.id = collection_id AND c.is_active = true
        )
    );

-- Function to auto-increment collection numbers
CREATE OR REPLACE FUNCTION get_next_collection_number(p_project_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    next_number integer;
BEGIN
    SELECT COALESCE(MAX(collection_number), 0) + 1
    INTO next_number
    FROM public.collections
    WHERE project_id = p_project_id;
    
    RETURN next_number;
END;
$$;

-- Function to set active collection (ensures only one active per project)
CREATE OR REPLACE FUNCTION set_active_collection(p_collection_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    p_project_id uuid;
BEGIN
    -- Get project_id for the collection
    SELECT project_id INTO p_project_id
    FROM public.collections
    WHERE id = p_collection_id;
    
    -- Deactivate all collections in the project
    UPDATE public.collections
    SET is_active = false
    WHERE project_id = p_project_id;
    
    -- Activate the specified collection
    UPDATE public.collections
    SET is_active = true
    WHERE id = p_collection_id;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_collections_updated_at 
    BEFORE UPDATE ON public.collections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
