-- Fix for customization_settings column
-- Copy and paste this into Supabase SQL Editor

-- Step 1: Add the missing column
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS customization_settings JSONB;

-- Step 2: Verify it was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'customization_settings';

-- Step 3: Test with a sample project (replace with your actual project ID)
-- UPDATE public.projects 
-- SET customization_settings = '{"textContent": "Hello World", "logoSize": 80, "textPosition": {"x": 0, "y": 150}}'::jsonb 
-- WHERE id = 'your-project-id-here';

-- Step 4: Check if any projects have customization settings
SELECT id, name, customization_settings 
FROM public.projects 
WHERE customization_settings IS NOT NULL;
