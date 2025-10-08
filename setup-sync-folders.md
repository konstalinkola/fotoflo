# Setup Sync Folders for Desktop Sync

## Step 1: Create the Database Table

Run this SQL in your Supabase SQL Editor:

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

## Step 2: Configure Sync Folders

1. **Go to your project page** in the web interface
2. **Look for a "Desktop Sync" tab or section**
3. **Add a sync folder:**
   - Click "Add Folder"
   - Enter a name (e.g., "My Photos")
   - Enter the folder path (e.g., `/Users/yourname/Desktop/Photos`)
   - Click "Add Folder"

## Step 3: Test the Desktop Client

After setting up sync folders, your desktop client should detect them and start monitoring.

## Troubleshooting

If you don't see the Desktop Sync section in your project page, it might need to be added to the project interface.
