# Phase 5d: Source Management - Complete

## Overview

Manage reference URLs for projects - add/edit/delete source materials that document project data, claims, and evidence.

## Files Created

### API Routes

**`src/app/api/admin/projects/[id]/sources/route.ts`**
- `GET /api/admin/projects/[id]/sources` - List all sources for a project
- `POST /api/admin/projects/[id]/sources` - Add new source (prevents duplicates)

**`src/app/api/admin/projects/[id]/sources/[sourceId]/route.ts`**
- `GET /api/admin/projects/[id]/sources/[sourceId]` - Get single source
- `PATCH /api/admin/projects/[id]/sources/[sourceId]` - Update source
- `DELETE /api/admin/projects/[id]/sources/[sourceId]` - Delete source

### UI Components

**`src/components/admin/project-sources.tsx`** - Source Management Component
- List view of all sources (newest first)
- Add/edit/delete sources
- Form with URL and title fields
- External link icon for visual clarity
- Source count display
- Duplicate URL prevention

**`src/app/admin/projects/[id]/page.tsx`** - Updated Project Edit Page
- Added fourth tab: "Sources"
- Integrated source management component

## Features

### Source List View
- ✅ Card-based layout with hover effects
- ✅ Shows title and URL for each source
- ✅ External link icon on URLs
- ✅ Clickable URLs (open in new tab)
- ✅ Source count at bottom
- ✅ Newest sources first

### Add/Edit Source Form
- ✅ Title field (required)
- ✅ URL field (required, validated)
- ✅ Inline form (shows/hides)
- ✅ Edit mode pre-fills data
- ✅ Duplicate URL detection

### Delete Source
- ✅ Confirmation dialog with source title
- ✅ Immediate UI update

### Duplicate Prevention
- ✅ Database unique constraint on (project_id, url)
- ✅ API checks for duplicates before insert
- ✅ Returns 409 Conflict if URL already exists
- ✅ Clear error message to user

### Security
- ✅ All routes protected with `requireAuth()`
- ✅ Project ownership verified
- ✅ URL validation
- ✅ Sources scoped to specific project

## Database Schema

**`project_sources` table:**
- id (UUID, primary key)
- projectId (UUID, foreign key → projects.id, CASCADE delete)
- url (TEXT, required)
- title (TEXT, required)
- createdAt (TIMESTAMPTZ, auto)

**Unique constraint:** `UNIQUE(project_id, url)` - prevents duplicate URLs per project

## API Examples

### List Sources
```bash
GET /api/admin/projects/uuid/sources
```

Response:
```json
{
  "sources": [
    {
      "id": "source-uuid",
      "projectId": "project-uuid",
      "url": "https://budget.gov.ng/2023-infrastructure",
      "title": "2023 Federal Budget - Infrastructure Allocation",
      "createdAt": "2026-01-15T10:00:00Z"
    },
    {
      "id": "source-uuid-2",
      "projectId": "project-uuid",
      "url": "https://news.example.com/project-launch",
      "title": "Project Launch Announcement",
      "createdAt": "2026-01-10T14:00:00Z"
    }
  ]
}
```

### Add Source
```bash
POST /api/admin/projects/uuid/sources
Content-Type: application/json

{
  "url": "https://mda.gov.ng/project-report-2024",
  "title": "Q4 2024 Project Progress Report"
}
```

Response (201):
```json
{
  "source": {
    "id": "new-uuid",
    "projectId": "project-uuid",
    "url": "https://mda.gov.ng/project-report-2024",
    "title": "Q4 2024 Project Progress Report",
    "createdAt": "2026-01-15T12:00:00Z"
  }
}
```

### Duplicate URL (409 Conflict)
```bash
POST /api/admin/projects/uuid/sources
Content-Type: application/json

{
  "url": "https://budget.gov.ng/2023-infrastructure",
  "title": "2023 Budget"
}
```

Response (409):
```json
{
  "error": "This URL is already added to this project"
}
```

### Update Source
```bash
PATCH /api/admin/projects/uuid/sources/source-uuid
Content-Type: application/json

{
  "title": "Updated Title: 2023 Federal Budget - Full Infrastructure Breakdown"
}
```

### Delete Source
```bash
DELETE /api/admin/projects/uuid/sources/source-uuid
```

Response:
```json
{
  "success": true
}
```

## UI Flow

1. **Navigate to project** → Edit any project
2. **Switch to Sources tab** → Click "Sources"
3. **View all sources** → See list of reference materials
4. **Add source:**
   - Click "Add Source"
   - Enter title (e.g., "2023 Budget Document")
   - Enter URL
   - Submit
5. **Edit source** → Click "Edit" → Modify → Save
6. **Delete source** → Click "Delete" → Confirm
7. **Try duplicate** → Add same URL again → See error message

## Use Cases

### Budget Sources
```
Title: "2023 Federal Budget - Capital Expenditure"
URL: https://budget.gov.ng/2023/capital-expenditure.pdf
```

### News Articles
```
Title: "Project Launched by Minister - Daily Trust"
URL: https://dailytrust.com/project-launched-minister
```

### Government Reports
```
Title: "MDA Q2 2024 Performance Report"
URL: https://mda.gov.ng/reports/q2-2024.pdf
```

### Project Documents
```
Title: "Engineering Assessment Report"
URL: https://docs.projectsite.gov.ng/assessment-2024.pdf
```

### Meeting Minutes
```
Title: "FEC Approval - January 2024"
URL: https://statehouse.gov.ng/fec-decisions-jan-2024
```

## Testing Checklist

- [x] TypeScript compiles
- [ ] Add a source to a project
- [ ] View source list
- [ ] Click source URL (opens in new tab)
- [ ] Edit existing source
- [ ] Try adding duplicate URL (should show error)
- [ ] Delete source
- [ ] Verify source count updates
- [ ] Add multiple sources to see list

## Known Limitations

1. **No source categorization** - All sources in one list (could add types: budget/news/report/etc.)
2. **No source date** - Doesn't track when source was published (only when added to system)
3. **No source attachment** - Only URLs, no file upload (that's Phase 5e)
4. **No source verification** - Doesn't check if URL is still valid/accessible
5. **No source notes** - Can't add context about what the source proves/contains

These can be added in future iterations if needed.

## Relationship to Other Features

### Sources vs Budgets/Status Updates
- **Budgets** and **Status Updates** each have their own source URL field
- **Project Sources** are general references for the project as a whole
- Use Project Sources for:
  - Initial project announcements
  - Overall project documentation
  - MDA reports
  - General news coverage
  - Engineering assessments

### Sources vs File Uploads (Phase 5e)
- **Sources** = External URLs (news, government sites, etc.)
- **File Uploads** (coming in 5e) = PDFs/Excel uploaded to Vercel Blob
- Both serve as evidence, different storage methods

## What's Next: Phase 5e

**File Upload:**
- Upload PDFs, Excel, Word files to Vercel Blob
- Store file metadata in `uploaded_files` table
- Link files to projects
- Display file list with download links
- Basic file parsing (text extraction) - advanced parsing later in Phase 6

**Prerequisites for 5e:**
- Confirm Vercel Blob is provisioned/configured
- Install `@vercel/blob` package
- Set up blob store token

---

**Phase 5d Status**: Complete ✅  
**Verification**: Test source CRUD operations
