# Fotoflo Auto Upload Backend API

A comprehensive auto upload system for Fotoflo that enables batch file processing, webhook integration, and intelligent file management.

## Features

- **Batch Upload Processing**: Upload multiple files efficiently with progress tracking
- **Duplicate Detection**: Prevent duplicate uploads using file hashing
- **Webhook Integration**: External service integration for automated uploads
- **Progress Tracking**: Real-time upload status and statistics
- **Auto Organization**: Smart folder/collection assignment
- **Background Processing**: Queue system for large batches
- **EXIF Extraction**: Automatic metadata extraction from images
- **File Validation**: Type checking, size limits, and security measures

## API Endpoints

### 1. Configuration Management

#### GET `/api/auto-upload/config`
Get auto upload configuration for a project.

**Parameters:**
- `projectId` (path): Project ID

**Response:**
```json
{
  "config": {
    "project_id": "uuid",
    "auto_organize": true,
    "duplicate_detection": true,
    "max_file_size": 10485760,
    "allowed_formats": ["image/jpeg", "image/png", "image/webp"],
    "webhook_url": "https://example.com/webhook",
    "webhook_secret": "secret_key",
    "auto_collection_creation": true,
    "collection_naming_pattern": "Auto Upload {date}",
    "background_processing": true
  }
}
```

#### POST `/api/auto-upload/config`
Save auto upload configuration for a project.

**Request Body:**
```json
{
  "project_id": "uuid",
  "auto_organize": true,
  "duplicate_detection": true,
  "max_file_size": 10485760,
  "allowed_formats": ["image/jpeg", "image/png", "image/webp"],
  "webhook_url": "https://example.com/webhook",
  "webhook_secret": "secret_key",
  "auto_collection_creation": true,
  "collection_naming_pattern": "Auto Upload {date}",
  "background_processing": true
}
```

#### DELETE `/api/auto-upload/config`
Delete auto upload configuration for a project.

### 2. Batch Upload

#### POST `/api/auto-upload/batch`
Process a batch of file uploads.

**Request:**
- Content-Type: `multipart/form-data`
- Files: `files[]` (multiple files)

**Response:**
```json
{
  "batch_id": "batch_1234567890_abc123",
  "total_files": 10,
  "successful_uploads": 8,
  "failed_uploads": 1,
  "duplicates_skipped": 1,
  "results": [
    {
      "file_name": "photo1.jpg",
      "success": true,
      "image_id": "uuid",
      "storage_path": "project_id/1234567890_abc123.jpg"
    },
    {
      "file_name": "photo2.jpg",
      "success": false,
      "error": "File too large"
    }
  ]
}
```

#### GET `/api/auto-upload/batch`
Get upload batch history for a project.

**Response:**
```json
{
  "batches": [
    {
      "batch_id": "batch_1234567890_abc123",
      "project_id": "uuid",
      "total_files": 10,
      "successful_uploads": 8,
      "failed_uploads": 1,
      "duplicates_skipped": 1,
      "status": "completed",
      "created_at": "2024-01-01T00:00:00Z",
      "completed_at": "2024-01-01T00:05:00Z"
    }
  ]
}
```

### 3. Webhook Integration

#### POST `/api/auto-upload/webhook`
Receive files from external services via webhook.

**Headers:**
- `x-webhook-secret`: Webhook secret for authentication

**Request Body:**
```json
{
  "project_id": "uuid",
  "files": [
    {
      "name": "photo1.jpg",
      "url": "https://example.com/photo1.jpg",
      "size": 1024000,
      "type": "image/jpeg",
      "metadata": {
        "source": "camera_app",
        "location": "New York"
      }
    }
  ],
  "batch_id": "optional_batch_id",
  "collection_id": "optional_collection_id",
  "source": "camera_app",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "batch_id": "webhook_1234567890_abc123",
  "processed_files": 1,
  "successful_uploads": 1,
  "failed_uploads": 0,
  "message": "Processed 1 files: 1 successful, 0 failed"
}
```

#### GET `/api/auto-upload/webhook`
Verify webhook configuration.

**Parameters:**
- `project_id` (query): Project ID

**Headers:**
- `x-webhook-secret`: Webhook secret for authentication

### 4. Status Monitoring

#### GET `/api/auto-upload/status`
Get upload status and statistics for a project.

**Parameters:**
- `projectId` (path): Project ID
- `batch_id` (query, optional): Specific batch ID

**Response:**
```json
{
  "project_id": "uuid",
  "auto_upload_enabled": true,
  "config": { /* config object */ },
  "recent_batches": [ /* batch objects */ ],
  "statistics": {
    "total_files": 100,
    "successful_uploads": 95,
    "failed_uploads": 3,
    "duplicates_skipped": 2,
    "success_rate": 95,
    "recent_activity": [ /* recent batches */ ]
  }
}
```

#### POST `/api/auto-upload/status`
Perform actions on upload batches.

**Request Body:**
```json
{
  "action": "retry_failed",
  "batch_id": "batch_1234567890_abc123"
}
```

## Database Schema

### auto_upload_config
```sql
CREATE TABLE auto_upload_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    auto_organize BOOLEAN DEFAULT true,
    duplicate_detection BOOLEAN DEFAULT true,
    max_file_size INTEGER DEFAULT 10485760,
    allowed_formats TEXT[] DEFAULT ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    webhook_url TEXT,
    webhook_secret TEXT,
    auto_collection_creation BOOLEAN DEFAULT true,
    collection_naming_pattern TEXT DEFAULT 'Auto Upload {date}',
    background_processing BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id)
);
```

### upload_batches
```sql
CREATE TABLE upload_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id TEXT NOT NULL UNIQUE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    total_files INTEGER NOT NULL DEFAULT 0,
    successful_uploads INTEGER NOT NULL DEFAULT 0,
    failed_uploads INTEGER NOT NULL DEFAULT 0,
    duplicates_skipped INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    upload_source TEXT DEFAULT 'manual',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(batch_id, project_id)
);
```

### Extended images table
Additional columns added to the existing images table:
- `file_hash`: SHA-256 hash for duplicate detection
- `upload_batch_id`: Reference to upload batch
- `upload_source`: Source of upload (manual, webhook, etc.)
- `original_name`: Original filename
- `external_metadata`: JSON metadata from external sources
- `collection_id`: Associated collection

## Usage Examples

### 1. Configure Auto Upload
```typescript
const config = {
  project_id: "your-project-id",
  auto_organize: true,
  duplicate_detection: true,
  max_file_size: 10485760, // 10MB
  allowed_formats: ["image/jpeg", "image/png", "image/webp"],
  webhook_url: "https://your-app.com/webhook",
  webhook_secret: "your-secret-key",
  auto_collection_creation: true,
  collection_naming_pattern: "Auto Upload {date}",
  background_processing: true
};

await fetch('/api/auto-upload/config', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(config)
});
```

### 2. Batch Upload Files
```typescript
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

### 3. Webhook Integration
```typescript
// External service sending files to Fotoflo
const webhookPayload = {
  project_id: "your-project-id",
  files: [
    {
      name: "photo1.jpg",
      url: "https://your-cdn.com/photo1.jpg",
      size: 1024000,
      type: "image/jpeg",
      metadata: { source: "mobile_app" }
    }
  ],
  source: "mobile_app",
  timestamp: new Date().toISOString()
};

await fetch('https://your-fotoflo.com/api/auto-upload/webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-secret': 'your-secret-key'
  },
  body: JSON.stringify(webhookPayload)
});
```

### 4. Monitor Upload Status
```typescript
const response = await fetch('/api/auto-upload/status');
const status = await response.json();

console.log(`Success rate: ${status.statistics.success_rate}%`);
console.log(`Total uploads: ${status.statistics.total_files}`);
```

## Security Features

1. **Authentication**: All endpoints require user authentication
2. **Project Ownership**: Users can only access their own projects
3. **Webhook Security**: Secret-based webhook authentication
4. **File Validation**: Type checking and size limits
5. **Rate Limiting**: Built-in batch processing to prevent system overload
6. **Input Sanitization**: All inputs are validated and sanitized

## Performance Optimizations

1. **Batch Processing**: Files processed in small batches to prevent timeouts
2. **Parallel Uploads**: Multiple files uploaded simultaneously
3. **Progress Tracking**: Real-time status updates
4. **Duplicate Detection**: Efficient file hashing for duplicate prevention
5. **Background Processing**: Large batches processed asynchronously
6. **Database Indexing**: Optimized queries with proper indexes

## Error Handling

The API provides comprehensive error handling with detailed error messages:

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid authentication
- **404 Not Found**: Project or resource not found
- **413 Payload Too Large**: File size exceeds limits
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server-side errors

## Monitoring and Analytics

The system includes built-in monitoring capabilities:

- Upload success rates
- File processing times
- Error tracking and logging
- Performance metrics
- Usage statistics

## Migration

To set up the auto upload system, run the database migration:

```bash
# Apply the migration
psql -d your_database -f auto_upload_migration.sql
```

This will create all necessary tables, indexes, and functions for the auto upload system.

## Integration with Existing System

The auto upload API seamlessly integrates with the existing Fotoflo system:

- Uses existing project and user authentication
- Leverages current storage infrastructure
- Extends the existing images table
- Maintains compatibility with current upload workflows
- Supports existing collection management

## Future Enhancements

Potential future improvements include:

- Real-time WebSocket notifications
- Advanced file processing (resize, compress)
- AI-powered image organization
- Cloud storage provider integration
- Advanced webhook filtering
- Bulk operations API
- Advanced analytics dashboard
