# Phase 5c: Status Updates - Complete

## Overview

Full timeline of status changes with automatic sync to project status via database trigger. Records when a project transitions between planned → ongoing → completed/stalled/abandoned.

## Files Created

### API Routes

**`src/app/api/admin/projects/[id]/status-updates/route.ts`**
- `GET /api/admin/projects/[id]/status-updates` - List all status updates (sorted by date DESC)
- `POST /api/admin/projects/[id]/status-updates` - Add new status update (auto-syncs `projects.status`)

**`src/app/api/admin/projects/[id]/status-updates/[updateId]/route.ts`**
- `GET /api/admin/projects/[id]/status-updates/[updateId]` - Get single update
- `PATCH /api/admin/projects/[id]/status-updates/[updateId]` - Update status update
- `DELETE /api/admin/projects/[id]/status-updates/[updateId]` - Delete status update

### UI Components

**`src/components/admin/project-status-updates.tsx`** - Status Timeline Component
- Timeline view of all status changes (newest first)
- Add/edit/delete status updates
- Form with all required fields
- Status badge color-coding (completed=green, ongoing=blue, stalled=yellow, abandoned=red)
- "CURRENT" badge on most recent entry
- Date formatting (Nigerian locale)
- Source URL links

**`src/app/admin/projects/[id]/page.tsx`** - Updated Project Edit Page
- Added third tab: "Status History"
- Integrated status updates component
- Passes `onStatusChange` callback to refresh project data

## Key Feature: Auto-Sync Status

**Database Trigger** (created in Phase 3):
```sql
CREATE OR REPLACE FUNCTION sync_project_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "projects"
  SET 
    "status" = NEW.status,
    "updated_at" = now()
  WHERE "id" = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_project_status_on_insert
  AFTER INSERT ON "status_updates"
  FOR EACH ROW
  EXECUTE FUNCTION sync_project_status();
```

**How it works:**
1. Admin records new status update via POST
2. Row inserted into `status_updates` table
3. Trigger fires automatically
4. `projects.status` updated to match new status
5. `projects.updated_at` set to current timestamp

**No app-level coordination needed** - database handles it!

## Features

### Status Timeline View
- ✅ Displays all status changes chronologically (newest first)
- ✅ Color-coded status badges
- ✅ "CURRENT" badge on most recent entry
- ✅ Date formatting (e.g., "15 January 2026")
- ✅ Clear visual hierarchy

### Status Change Form
- ✅ Status dropdown (planned, ongoing, completed, stalled, abandoned)
- ✅ Date picker (when the status change occurred)
- ✅ Note field (required - what happened?)
- ✅ Source URL (required for transparency)
- ✅ Source title (optional)
- ✅ Info message about auto-sync on new entries

### Edit/Delete
- ✅ Edit existing status updates
- ✅ Delete with confirmation
- ✅ Note: Editing/deleting does NOT re-trigger sync (only INSERT does)

### Security
- ✅ All routes protected with `requireAuth()`
- ✅ Project ownership verified
- ✅ Status value validation
- ✅ `createdBy` tracks which admin created each entry

## Database Schema Fields

All `status_updates` table fields:

**Status Data**:
- status (required: planned/ongoing/completed/stalled/abandoned)
- date (required: DATE when status changed)
- note (required: TEXT explaining what happened)

**Source Documentation** (required):
- sourceUrl (required)
- sourceTitle (optional)

**Metadata** (auto-managed):
- createdBy (set on create)
- createdAt (auto)

## API Examples

### List Status Updates
```bash
GET /api/admin/projects/uuid/status-updates
```

Response:
```json
{
  "statusUpdates": [
    {
      "id": "update-uuid",
      "projectId": "project-uuid",
      "status": "abandoned",
      "date": "2025-06-15",
      "note": "Contractor abandoned site after 6 months of inactivity. No response to notices.",
      "sourceUrl": "https://news.example.com/project-abandoned",
      "sourceTitle": "Local News - Project Abandoned",
      "createdBy": "admin-uuid",
      "createdAt": "2026-01-15T10:00:00Z"
    },
    {
      "id": "update-uuid-2",
      "projectId": "project-uuid",
      "status": "stalled",
      "date": "2024-12-01",
      "note": "Work halted due to funding delays",
      "sourceUrl": "https://gov.example.com/report",
      "sourceTitle": "Government Report",
      "createdBy": "admin-uuid",
      "createdAt": "2026-01-10T14:00:00Z"
    }
  ]
}
```

### Add Status Update
```bash
POST /api/admin/projects/uuid/status-updates
Content-Type: application/json

{
  "status": "ongoing",
  "date": "2026-01-01",
  "note": "Construction resumed after contractor replacement",
  "sourceUrl": "https://news.example.com/construction-resumed",
  "sourceTitle": "Construction Resumed"
}
```

Response (201):
```json
{
  "statusUpdate": {
    "id": "new-uuid",
    "projectId": "project-uuid",
    "status": "ongoing",
    "date": "2026-01-01",
    "note": "Construction resumed after contractor replacement",
    "sourceUrl": "https://news.example.com/construction-resumed",
    "sourceTitle": "Construction Resumed",
    "createdBy": "admin-uuid",
    "createdAt": "2026-01-15T12:00:00Z"
  }
}
```

**Side effect:** `projects.status` is now `"ongoing"` (via trigger)

### Update Status Update
```bash
PATCH /api/admin/projects/uuid/status-updates/update-uuid
Content-Type: application/json

{
  "note": "Updated: Construction resumed with new contractor and revised timeline"
}
```

### Delete Status Update
```bash
DELETE /api/admin/projects/uuid/status-updates/update-uuid
```

## Status Badge Colors

Visual color-coding for quick status recognition:

- **Planned**: Gray (`bg-gray-100 text-gray-800`)
- **Ongoing**: Blue (`bg-blue-100 text-blue-800`)
- **Completed**: Green (`bg-green-100 text-green-800`)
- **Stalled**: Yellow (`bg-yellow-100 text-yellow-800`)
- **Abandoned**: Red (`bg-red-100 text-red-800`)

## UI Flow

1. **Navigate to project** → Edit any project
2. **Switch to Status History tab** → Click "Status History"
3. **View timeline** → See all status changes chronologically
4. **Record new status** → Click "Record Status Change" → Fill form → Submit
5. **Verify auto-sync** → Switch back to "Project Details" tab → See updated status
6. **Edit update** → Click "Edit" on any entry → Modify → Save
7. **Delete update** → Click "Delete" → Confirm

## Testing Checklist

- [x] TypeScript compiles
- [ ] Record a status change (e.g., planned → ongoing)
- [ ] Verify project status updated automatically
- [ ] View status timeline with multiple entries
- [ ] Verify "CURRENT" badge on newest entry
- [ ] Edit existing status update
- [ ] Delete status update
- [ ] Verify date formatting displays correctly
- [ ] Verify source URL links open correctly
- [ ] Test color-coding for all status types

## Known Limitations

1. **No status validation logic** - Doesn't prevent illogical transitions (e.g., abandoned → completed)
2. **Trigger only fires on INSERT** - Editing/deleting old entries doesn't recalculate current status
3. **No status duration calculation** - Doesn't show how long each status lasted
4. **No notifications** - Doesn't alert when status changes
5. **No approval workflow** - All status changes are immediate

These can be added in future iterations if needed.

## Important Notes

### About the Trigger

- **Only INSERT triggers sync** - Creating a new status update syncs `projects.status`
- **UPDATE does not re-sync** - Editing an old status update doesn't change `projects.status`
- **DELETE does not re-sync** - Deleting an old status update doesn't recalculate current status

This is intentional: the most recent `INSERT` always determines the current status. If you need to change the current status, add a new status update (don't edit old ones).

### Source URL Requirement

Every status change **requires** a source URL. This ensures:
- Transparency and verifiability
- Audit trail for status changes
- Evidence-based project tracking
- Accountability for status claims

## What's Next: Phase 5d

**Source Management:**
- Add source URLs to projects
- View all sources
- Edit/delete source entries
- Link sources to specific claims/data points

---

**Phase 5c Status**: Complete ✅  
**Verification**: Test status update workflow and verify auto-sync
