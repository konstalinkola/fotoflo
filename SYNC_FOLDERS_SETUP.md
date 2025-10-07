# Sync Folders Database Setup

To complete the seamless desktop sync setup, you need to create the `sync_folders` table in your Supabase database.

## Option 1: Run in Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the following SQL:

```sql
-- Create sync_folders table for desktop sync functionality
CREATE TABLE IF NOT EXISTS sync_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    folder_path TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique folder paths per project
    UNIQUE(project_id, folder_path)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sync_folders_project_id ON sync_folders(project_id);
CREATE INDEX IF NOT EXISTS idx_sync_folders_active ON sync_folders(active);

-- Add RLS (Row Level Security) policies
ALTER TABLE sync_folders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access sync folders for their own projects
CREATE POLICY "Users can manage their own project sync folders" ON sync_folders
    FOR ALL USING (
        project_id IN (
            SELECT id FROM projects WHERE owner = auth.uid()
        )
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_sync_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_folders_updated_at
    BEFORE UPDATE ON sync_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_sync_folders_updated_at();
```

4. Click "Run" to execute the SQL

## Option 2: Use the Migration Script

If you prefer to use the migration script:

```bash
cd /Users/konstalinkola/Documents/Kuvapalvelin/Code/kuvapalvelin
node apply_sync_folders_migration.js
```

## After Database Setup

Once the table is created, you can:

1. **Start the sync service:**
   ```bash
   npm run sync:start
   ```

2. **Start both dev server and sync service:**
   ```bash
   npm run sync:dev
   ```

3. **Test the seamless experience:**
   - Go to Project Settings → Desktop Sync
   - Click "Add Folder"
   - Use the "Browse" button to select a folder
   - Watch the "Monitoring" indicator appear
   - Drop photos into the folder and see them sync automatically!

## How It Works

1. **User selects folder** in project settings using native folder picker
2. **Folder is saved** to `sync_folders` table in database
3. **Background service** monitors all active sync folders
4. **New photos** are automatically detected and uploaded
5. **Gallery updates** in real-time via existing SSE system

The system now provides a completely seamless experience - no command line, no manual setup, just select folders and drop photos!
