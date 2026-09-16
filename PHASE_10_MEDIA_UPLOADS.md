# Phase 10: Project Media Upload System

## Overview
Implemented a comprehensive image upload and gallery system for projects, allowing admins to upload multiple photos and media files that can be displayed in project details and on the public map.

## What Was Added

### 1. Project Media Component
**Location:** `src/components/admin/project-media.tsx`

**Features:**
- **Image Grid Gallery**: Displays uploaded images in a responsive grid (2/3/4 columns)
- **Multiple Upload**: Upload multiple images at once via file picker or drag-and-drop
- **Lightbox Viewer**: Click any image to view full-size with navigation
- **Delete Functionality**: Hover over images to reveal delete button
- **File Info Overlay**: Shows filename and size on hover
- **Drag & Drop**: Drag images directly onto the upload area
- **Progress Indication**: Shows upload status
- **Error Handling**: Displays clear error messages

**Supported Formats:**
- JPEG/JPG
- PNG
- WebP

**Limits:**
- Max file size: 10MB per image
- Multiple files can be uploaded simultaneously

### 2. Admin API Endpoints

#### `/api/admin/projects/[id]/media` - GET
**Purpose:** List all images for a project (admin only)

**Response:**
```json
[
  {
    "id": "uuid",
    "fileName": "project-photo.jpg",
    "fileType": "image/jpeg",
    "fileSize": 2048576,
    "storageUrl": "https://...blob.vercel-storage.com/...",
    "uploadedBy": "admin-id",
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
]
```

#### `/api/admin/projects/[id]/media` - POST
**Purpose:** Upload a new image

**Request:** `multipart/form-data` with `file` field

**Validation:**
- File type must be JPG, PNG, or WebP
- File size must be ≤ 10MB
- User must be authenticated admin

**Response:**
```json
{
  "id": "uuid",
  "fileName": "uploaded-image.jpg",
  "fileType": "image/jpeg",
  "fileSize": 1234567,
  "storageUrl": "https://...blob.vercel-storage.com/projects/{projectId}/media/...",
  "uploadedBy": "admin-id",
  "uploadedAt": "2024-01-15T10:30:00Z"
}
```

#### `/api/admin/projects/[id]/media/[mediaId]` - DELETE
**Purpose:** Delete a specific image

**Process:**
1. Verifies user authentication
2. Checks that media belongs to the specified project
3. Deletes file from Vercel Blob storage
4. Removes database record

**Response:**
```json
{
  "success": true
}
```

### 3. Public API Endpoint

#### `/api/projects/[id]/media` - GET (Public)
**Purpose:** Fetch project images for public display

**Features:**
- No authentication required
- Returns only public-safe fields
- Filters to images only (excludes other file types)

**Response:**
```json
[
  {
    "id": "uuid",
    "fileName": "project-photo.jpg",
    "fileType": "image/jpeg",
    "fileSize": 2048576,
    "storageUrl": "https://...blob.vercel-storage.com/...",
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
]
```

**Note:** Excludes `uploadedBy` and other admin-specific fields

### 4. Admin UI Integration

**Project Edit Page** - Added "Media" Tab
- Located between "Sources" and "Files" tabs
- Accessible only for existing projects (not during creation)
- Separate from general "Files" tab for clear distinction

**Tab Structure:**
```
Details | Budgets | Status History | Sources | Media | Files
```

## Technical Implementation

### Storage Strategy
**Vercel Blob Storage** with organized folder structure:
```
projects/
  {projectId}/
    media/
      {filename}-{random-suffix}.jpg
      {filename}-{random-suffix}.png
```

### Database Schema
Uses existing `uploadedFiles` table:
- `projectId`: Links to project
- `fileName`: Original filename
- `fileType`: MIME type (filtered to `image/*`)
- `fileSize`: Size in bytes
- `storageUrl`: Public Blob URL
- `uploadedBy`: Admin who uploaded
- `uploadedAt`: Timestamp

### Image Filtering
Images are distinguished from other files by MIME type:
```typescript
const imageFiles = files.filter((file) =>
  file.fileType.startsWith('image/')
);
```

## User Experience

### Upload Flow
1. Admin navigates to project → Media tab
2. Click "Click to upload" or drag images onto upload area
3. Select one or multiple images
4. Progress indicator shows "Uploading images..."
5. Images appear in grid immediately after upload
6. Success! Ready to upload more

### View Flow
1. Images displayed in responsive grid
2. Hover over image shows:
   - Filename
   - File size
   - Delete button (red trash icon)
3. Click image to open lightbox
4. In lightbox:
   - View full-size image
   - See metadata (filename, size, upload date)
   - Click outside or X to close

### Delete Flow
1. Hover over image in grid
2. Click red trash icon in top-right corner
3. Confirm deletion
4. Image removed from storage and database
5. Grid updates immediately

## Code Examples

### Uploading Images
```typescript
const uploadFiles = async (files: File[]) => {
  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);

    await fetch(`/api/admin/projects/${projectId}/media`, {
      method: 'POST',
      body: formData,
    });
  }
  
  await loadMedia(); // Refresh gallery
};
```

### Fetching Public Media
```typescript
const response = await fetch(`/api/projects/${projectId}/media`);
const images = await response.json();

// Display in UI
images.forEach(image => {
  console.log(image.storageUrl); // Direct public URL
});
```

### Deleting Media
```typescript
const deleteMedia = async (mediaId: string) => {
  await fetch(`/api/admin/projects/${projectId}/media/${mediaId}`, {
    method: 'DELETE',
  });
  
  await loadMedia(); // Refresh gallery
};
```

## Benefits

1. **Visual Documentation**: Projects can now have photo galleries
2. **Evidence-Based**: Upload progress photos, before/after shots
3. **Public Transparency**: Images accessible via public API
4. **User-Friendly**: Drag-and-drop, multiple uploads, instant preview
5. **Organized Storage**: Files organized by project in Blob storage
6. **Efficient**: Images stored separately from documents for performance
7. **Secure**: Admin-only upload, but public read access

## Future Enhancements

- **Image Captions**: Add caption/description field for each image
- **Image Reordering**: Drag to reorder images in gallery
- **Bulk Delete**: Select multiple images to delete at once
- **Image Optimization**: Auto-resize/compress large images
- **Cover Image**: Set a primary/cover image for each project
- **Gallery Slideshow**: Auto-play slideshow mode
- **Image Metadata**: Extract and display EXIF data (date taken, location)
- **Watermarking**: Add project name watermark to images
- **Image Search**: Search images by filename or caption
- **Public Gallery View**: Dedicated public gallery page for projects

## Testing Checklist

- [ ] Upload single image via file picker
- [ ] Upload multiple images at once
- [ ] Drag and drop images onto upload area
- [ ] View image in lightbox by clicking
- [ ] Close lightbox with X button or click outside
- [ ] Delete image using hover trash icon
- [ ] Verify image appears in grid immediately after upload
- [ ] Check that only images appear in Media tab (not documents)
- [ ] Test file size validation (try > 10MB)
- [ ] Test file type validation (try .pdf or .doc)
- [ ] Verify public API returns images without auth
- [ ] Check that deleted images are removed from Blob storage
- [ ] Test responsive grid on mobile/tablet/desktop
- [ ] Verify Media tab only shows for existing projects (not "new")

## Storage Costs

**Vercel Blob Pricing (as of 2024):**
- Free tier: 500 MB storage, 5 GB bandwidth/month
- Pro: $0.15/GB storage, $0.30/GB bandwidth

**Estimation:**
- Average image: 2MB
- 100 images ≈ 200MB storage
- Stays within free tier for small deployments

## Security Considerations

1. **Upload Authentication**: Only authenticated admins can upload
2. **File Type Validation**: Server-side MIME type checking
3. **File Size Limits**: Prevents abuse with 10MB cap
4. **Public Access**: Images are public-readable (intentional for transparency)
5. **Delete Authorization**: Only admins can delete media
6. **Project Association**: Media strictly tied to project IDs

## API Rate Limiting

Consider implementing rate limiting for production:
- Max 10 uploads per minute per admin
- Max 50 MB total uploads per hour per admin
- Public API: 100 requests per minute per IP

(Not currently implemented - add if needed)
