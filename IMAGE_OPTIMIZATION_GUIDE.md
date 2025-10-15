# Image Optimization System

## Overview

Fotoflo now uses a three-tier image optimization system that dramatically improves loading performance by serving appropriately-sized images based on context.

## Image Variants

Every uploaded image is automatically processed into three variants:

1. **Thumbnail** (240x240px, JPEG 80% quality)
   - Size: ~5-15KB
   - Usage: Grid galleries, collection covers
   - Generated: On upload

2. **Preview** (1200px wide, JPEG 85% quality)
   - Size: ~100-300KB
   - Usage: Lightbox views, public page displays
   - Generated: On upload

3. **Original** (Full resolution, original quality)
   - Size: Original file size (typically 2-10MB)
   - Usage: Download only
   - Stored: As uploaded

## Performance Gains

- **Gallery loads:** 80-95% faster (5-15KB thumbnails vs 2-5MB originals)
- **Lightbox views:** 50-70% faster (100-300KB previews vs 2-5MB originals)
- **Bandwidth savings:** ~90% reduction for typical browsing patterns
- **Mobile experience:** Dramatically improved on slow connections

## Setup Instructions

### 1. Apply Database Migration

Run the SQL migration to add variant columns to the images table:

```bash
# Connect to your Supabase database and run:
psql $DATABASE_URL -f add_image_variants_migration.sql
```

Or apply via Supabase Dashboard:
1. Go to SQL Editor
2. Paste contents of `add_image_variants_migration.sql`
3. Run the query

### 2. Migrate Existing Images

For existing images that don't have variants yet, run the migration script:

```bash
# Install tsx if you haven't already
npm install -g tsx

# Run the migration script
cd kuvapalvelin
npx tsx scripts/migrate-existing-images.ts
```

The script will:
- Find all images without thumbnail/preview variants
- Download originals from Supabase Storage
- Generate thumbnail and preview variants
- Upload variants to storage
- Update database records
- Process in batches of 10 to avoid overwhelming the server

**Note:** This process may take time depending on how many images you have. The script shows progress and handles errors gracefully.

### 3. Create Storage Subdirectories

The variants are stored in subdirectories within each project's storage folder:
- `{projectId}/thumbnails/` - For thumbnails
- `{projectId}/previews/` - For previews
- `{projectId}/` - For originals (unchanged)

These directories are created automatically when images are uploaded.

## How It Works

### Upload Flow

1. User uploads an image
2. Server processes image with Sharp library:
   - Generates 240x240px thumbnail (cover fit)
   - Generates 1200px wide preview
   - Keeps original as-is
3. All three variants uploaded to Supabase Storage
4. Database record includes paths to all three variants

### Serving Flow

**Gallery Views (Private):**
- API returns thumbnail URLs by default
- Frontend displays thumbnails in grid

**Collection Gallery (Public):**
- Grid: Uses thumbnail_url
- Lightbox: Uses preview_url
- Download: Uses original_url

**Project Dashboard:**
- Grid view: Thumbnails
- Active image display: Preview or original

## API Endpoints

### Get Images with Variants
```
GET /api/projects/{projectId}/images
Returns: Array of images with thumbnail URLs for gallery display
```

### Get Specific Image Variant
```
GET /api/projects/{projectId}/images/{imageId}?variant=thumbnail|preview|original
Returns: Signed URL for requested variant
```

### Get Public Collection
```
GET /api/public/{projectId}/collection/{collectionId}
Returns: Images with all three variant URLs (thumbnail_url, preview_url, original_url)
```

## Frontend Usage

### ImageGallery Component

The component automatically uses thumbnails from the API:

```tsx
// API returns thumbnail URLs by default
const { data } = await fetch(`/api/projects/${projectId}/images`);
// data.images[].url now points to thumbnails
```

### Public Page

Uses different variants for different contexts:

```tsx
// Grid display
<Image src={image.thumbnail_url} />

// Lightbox
<Image src={image.preview_url} />

// Download
const response = await fetch(image.original_url);
```

## Backward Compatibility

The system is backward compatible with existing images:

- If `thumbnail_path` is null, API falls back to `storage_path` (original)
- If `preview_path` is null, API falls back to `storage_path` (original)
- Old images work but don't get performance benefits
- Run migration script to optimize old images

## Monitoring

Check variant generation in logs:

```
🖼️  Generating image variants...
✅ Image variants generated successfully
📤 Uploading original, thumbnail, and preview...
✅ All variants uploaded successfully
```

If variants fail to generate, the original upload still succeeds but won't have optimization benefits.

## Troubleshooting

### Migration Script Fails

**Issue:** Images fail to migrate
**Solution:** 
- Check Supabase storage permissions
- Verify SUPABASE_SERVICE_ROLE_KEY is set correctly
- Check storage quota (variants use ~10-15% extra storage)

### Thumbnails Not Showing

**Issue:** Images show but are slow to load
**Solution:**
- Run migration script for existing images
- Check browser network tab to verify thumbnail URLs are being used
- Ensure storage subdirectories have correct permissions

### Sharp Installation Issues

**Issue:** Sharp library fails to install
**Solution:**
```bash
npm install --include=optional sharp
```

Or rebuild:
```bash
npm rebuild sharp
```

## Storage Considerations

- **Storage Usage:** Variants add ~10-15% to total storage
  - Thumbnail: ~1-2% of original
  - Preview: ~8-12% of original
  - Worth it for 90% bandwidth savings

- **Storage Organization:**
  ```
  project-id/
  ├── 1234567890.jpg          (original)
  ├── thumbnails/
  │   └── 1234567890.jpg      (240x240)
  └── previews/
      └── 1234567890.jpg      (1200px wide)
  ```

## Future Enhancements

Potential improvements for the future:

1. **WebP variants** - Even smaller file sizes
2. **Responsive sizes** - Multiple preview sizes for different screens
3. **Lazy variant generation** - Generate on-demand with caching
4. **CDN integration** - Serve variants from edge locations
5. **Automatic cleanup** - Remove variants when originals are deleted

## Related Files

- `src/lib/image-processor.ts` - Core image processing logic
- `src/app/api/projects/[projectId]/upload/route.ts` - Upload with variants
- `scripts/migrate-existing-images.ts` - Migration script
- `add_image_variants_migration.sql` - Database schema update

