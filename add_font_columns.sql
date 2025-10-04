-- Add font family and weight columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS font_weight TEXT DEFAULT '400';

-- Add comments explaining the new fields
COMMENT ON COLUMN public.projects.font_family IS 'Font family for text elements (e.g., Inter, Roboto, Arial)';
COMMENT ON COLUMN public.projects.font_weight IS 'Font weight for text elements (e.g., 400, 500, 600, 700)';
