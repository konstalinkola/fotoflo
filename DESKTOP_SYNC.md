# Desktop Folder Sync Setup

This guide shows how to sync a local folder with your Kuvapalvelin project using rclone.

## Prerequisites

1. Install rclone: https://rclone.org/downloads/
2. Get your Supabase Storage credentials from your project settings

## Setup Steps

### 1. Configure rclone for Supabase

```bash
rclone config
```

Choose:
- **n** (new remote)
- **Name**: `supabase` (or any name you prefer)
- **Storage**: `s3` (Amazon S3 compatible)
- **Provider**: `Other`
- **Access Key ID**: Your Supabase service role key
- **Secret Access Key**: Your Supabase service role key (same as above)
- **Region**: `us-east-1`
- **Endpoint**: `https://[your-project-ref].supabase.co`
- **Location Constraint**: Leave blank
- **ACL**: Leave blank
- **Server Side Encryption**: Leave blank
- **Storage Class**: Leave blank

### 2. Test the connection

```bash
rclone lsd supabase:
```

You should see your storage buckets listed.

### 3. Create sync command

Replace the placeholders with your actual values:

```bash
# Basic sync (one-way: local → Supabase)
rclone sync /path/to/your/photos supabase:your-bucket-name/user-id/project-id/ --progress

# Two-way sync (keeps both sides in sync)
rclone bisync /path/to/your/photos supabase:your-bucket-name/user-id/project-id/ --progress

# Watch mode (auto-sync when files change)
rclone bisync /path/to/your/photos supabase:your-bucket-name/user-id/project-id/ --progress --resync
```

### 4. Find your user ID and project ID

- **User ID**: Check your Supabase auth users table or use the dashboard
- **Project ID**: Found in your project URL: `/project/[projectId]`
- **Bucket name**: Set in your project settings

### 5. Example commands

```bash
# Sync Lightroom export folder
rclone sync ~/Pictures/Lightroom\ Exports supabase:photos/abc123-def456/789xyz/ --progress

# Auto-sync with file watching
rclone bisync ~/Pictures/Lightroom\ Exports supabase:photos/abc123-def456/789xyz/ --progress --resync
```

### 6. Automation (Optional)

Create a script to run sync automatically:

**macOS/Linux** (`sync-photos.sh`):
```bash
#!/bin/bash
rclone bisync ~/Pictures/Lightroom\ Exports supabase:photos/abc123-def456/789xyz/ --progress --resync
```

**Windows** (`sync-photos.bat`):
```batch
rclone bisync "C:\Users\YourName\Pictures\Lightroom Exports" "supabase:photos/abc123-def456/789xyz/" --progress --resync
```

## Tips

- Use `--dry-run` first to test without actually syncing
- Add `--exclude "*.tmp"` to ignore temporary files
- Use `--delete-excluded` to remove files that no longer match your filters
- Set up a cron job (Linux/macOS) or Task Scheduler (Windows) for automatic syncing

## Troubleshooting

- **Permission errors**: Make sure you're using the service role key, not the anon key
- **Connection issues**: Verify your Supabase project URL and credentials
- **File not appearing**: Check the folder path matches exactly: `user-id/project-id/`
