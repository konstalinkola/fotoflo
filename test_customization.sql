-- Test script to check if customization_settings column exists
-- Run this in your Supabase SQL Editor

-- Check if the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'customization_settings';

-- If the column doesn't exist, run this:
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS customization_settings JSONB;

-- Test insert/update
UPDATE public.projects 
SET customization_settings = '{"textContent": "test", "logoSize": 80}'::jsonb 
WHERE id = 'your-project-id-here';

-- Check if it worked
SELECT id, name, customization_settings 
FROM public.projects 
WHERE customization_settings IS NOT NULL;
