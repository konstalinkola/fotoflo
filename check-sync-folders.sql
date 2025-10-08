-- Check if sync_folders table exists and is properly configured
-- Run this in your Supabase SQL Editor to verify the setup

-- 1. Check if the table exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'sync_folders';

-- 2. Check the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'sync_folders' 
ORDER BY ordinal_position;

-- 3. Check if indexes exist
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'sync_folders';

-- 4. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'sync_folders';

-- 5. Check existing policies
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'sync_folders';

-- 6. Check if there are any existing sync folders
SELECT COUNT(*) as total_sync_folders FROM sync_folders;

-- 7. If there are sync folders, show them
SELECT id, project_id, name, folder_path, active, created_at 
FROM sync_folders 
ORDER BY created_at DESC;
