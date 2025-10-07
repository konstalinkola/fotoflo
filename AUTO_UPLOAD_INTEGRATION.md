# Fotoflo Auto Upload Integration Guide

This guide will help you integrate the new Auto Upload API into your existing Fotoflo project.

## 🚀 Quick Start

### 1. Apply Database Migration

```bash
# Apply the auto upload database migration
node setup_auto_upload.js --migrate

# Optional: Create default configurations for all existing projects
node setup_auto_upload.js --migrate --config
```

### 2. Verify Setup

```bash
# Test the API endpoints
node test_auto_upload.js
```

### 3. Add Auto Upload Component to Your Project

Add the `AutoUpload` component to your project settings or dashboard:

```tsx
// In your project page or settings
import AutoUpload from '@/components/AutoUpload';

export default function ProjectSettings() {
  return (
    <div>
      <h2>Auto Upload Configuration</h2>
      <AutoUpload 
        projectId={projectId} 
        onUploadSuccess={() => {
          // Refresh your image gallery or show success message
          console.log('Upload completed!');
        }} 
      />
    </div>
  );
}
```

## 📁 Files Created

The following files have been added to your project:

### API Routes
- `src/app/api/auto-upload/config/route.ts` - Configuration management
- `src/app/api/auto-upload/batch/route.ts` - Batch upload processing
- `src/app/api/auto-upload/webhook/route.ts` - Webhook integration
- `src/app/api/auto-upload/status/route.ts` - Status monitoring

### Components
- `src/components/AutoUpload.tsx` - Main auto upload UI component

### Libraries
- `src/lib/auto-upload.ts` - Auto upload service library

### Database
- `auto_upload_migration.sql` - Database migration script

### Documentation
- `AUTO_UPLOAD_API.md` - Complete API documentation
- `AUTO_UPLOAD_INTEGRATION.md` - This integration guide

### Scripts
- `setup_auto_upload.js` - Setup and migration script
- `test_auto_upload.js` - API testing script

## 🔧 Configuration

### Environment Variables

Ensure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Permissions

The migration script will create the necessary tables and permissions. If you encounter permission issues, you may need to grant additional permissions:

```sql
-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON auto_upload_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON upload_batches TO authenticated;
GRANT SELECT ON upload_statistics TO authenticated;
```

## 🎯 Usage Examples

### 1. Basic Batch Upload

```typescript
// Upload multiple files at once
const formData = new FormData();
files.forEach(file => {
  formData.append('files', file);
});

const response = await fetch('/api/auto-upload/batch', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(`Uploaded ${result.successful_uploads}/${result.total_files} files`);
```

### 2. Webhook Integration

```typescript
// External service sending files to Fotoflo
const webhookPayload = {
  project_id: "your-project-id",
  files: [
    {
      name: "photo.jpg",
      url: "https://example.com/photo.jpg",
      size: 1024000,
      type: "image/jpeg"
    }
  ],
  source: "mobile_app"
};

await fetch('/api/auto-upload/webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-secret': 'your-webhook-secret'
  },
  body: JSON.stringify(webhookPayload)
});
```

### 3. Configuration Management

```typescript
// Get current configuration
const configResponse = await fetch('/api/auto-upload/config?projectId=your-project-id');
const config = await configResponse.json();

// Update configuration
const newConfig = {
  project_id: "your-project-id",
  auto_organize: true,
  duplicate_detection: true,
  max_file_size: 20971520, // 20MB
  allowed_formats: ["image/jpeg", "image/png", "image/webp"],
  auto_collection_creation: true,
  collection_naming_pattern: "Auto Upload {date}"
};

await fetch('/api/auto-upload/config', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newConfig)
});
```

## 🔒 Security Considerations

### Webhook Security

1. **Always use webhook secrets** for authentication
2. **Validate webhook signatures** in production
3. **Rate limit webhook endpoints** to prevent abuse
4. **Sanitize file URLs** before downloading

### File Validation

The API includes built-in validation:
- File type checking
- File size limits
- Duplicate detection via file hashing
- Input sanitization

### Authentication

All endpoints require user authentication and verify project ownership.

## 📊 Monitoring

### Upload Statistics

```typescript
// Get upload statistics
const statsResponse = await fetch('/api/auto-upload/status?projectId=your-project-id');
const stats = await statsResponse.json();

console.log(`Success rate: ${stats.statistics.success_rate}%`);
console.log(`Total uploads: ${stats.statistics.total_files}`);
```

### Batch History

```typescript
// Get recent upload batches
const batchesResponse = await fetch('/api/auto-upload/batch?projectId=your-project-id');
const batches = await batchesResponse.json();

batches.batches.forEach(batch => {
  console.log(`Batch ${batch.batch_id}: ${batch.successful_uploads}/${batch.total_files} successful`);
});
```

## 🚨 Troubleshooting

### Common Issues

1. **Migration fails**: Check database permissions and connection
2. **Upload fails**: Verify file size limits and allowed formats
3. **Webhook fails**: Check webhook secret and URL accessibility
4. **Duplicate detection**: Ensure file hash column exists in images table

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=auto-upload:*
```

### Performance Issues

1. **Large batches**: Process files in smaller batches (default: 5 files)
2. **Memory usage**: Monitor memory usage for large file uploads
3. **Database locks**: Ensure proper indexing on upload_batches table

## 🔄 Migration from Existing Upload

The auto upload system is designed to work alongside your existing upload system:

1. **No breaking changes** to existing upload functionality
2. **Gradual migration** - you can enable auto upload per project
3. **Backward compatibility** - existing uploads continue to work
4. **Shared storage** - uses the same Supabase storage buckets

## 📈 Performance Optimization

### Database Optimization

The migration includes optimized indexes:
- `idx_images_file_hash` - Fast duplicate detection
- `idx_upload_batches_project` - Efficient batch queries
- `idx_images_uploaded_at` - Chronological sorting

### Batch Processing

- Files processed in batches of 5 to prevent timeouts
- Parallel processing within each batch
- Progress tracking for large uploads

### Caching

- EXIF data caching for repeated uploads
- Batch status caching for dashboard queries

## 🎉 Next Steps

1. **Test the integration** with the provided test script
2. **Configure auto upload** for your projects
3. **Set up webhooks** for external integrations
4. **Monitor performance** and adjust settings as needed
5. **Customize the UI** component to match your design

## 📞 Support

If you encounter issues:

1. Check the API documentation in `AUTO_UPLOAD_API.md`
2. Run the test script to verify functionality
3. Check database logs for migration issues
4. Verify environment variables and permissions

## 🔮 Future Enhancements

Planned features:
- Real-time WebSocket notifications
- Advanced file processing (resize, compress)
- AI-powered image organization
- Cloud storage provider integration
- Advanced analytics dashboard

---

**Happy uploading! 🚀**
