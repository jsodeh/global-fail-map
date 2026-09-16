# Phase 5g: Submissions Queue - Implementation Summary

## Completed: September 15, 2026

### Overview
Built public submission system allowing citizens to suggest new projects for tracking, and admin review interface for approving/rejecting submissions. Approved submissions automatically create new projects in the database.

---

## Changes Made

### 1. Public Submission API

#### `src/app/api/submissions/route.ts`
- **POST:** Submit a new project suggestion
  - **Public endpoint** (no authentication required)
  - Validates required fields and content length
  - Prevents spam with 5000 character limit
  - Supports multiple submission types (focus on `new_project` for this phase)
  - Stores submissions in `pending_submissions` table with status='pending'
  - Returns submission ID and success message

**Request Body:**
```json
{
  "submitterName": "John Doe" (optional),
  "submitterContact": "john@example.com" (optional),
  "claimText": "Description of the project..." (required),
  "sourceUrl": "https://source-url.com" (optional),
  "submissionType": "new_project" (default)
}
```

---

### 2. Admin Review API

#### `src/app/api/admin/submissions/route.ts`
- **GET:** List all submissions
  - Authenticated (admin or super admin)
  - Query parameter: `?status=pending|approved|rejected|all`
  - Returns submissions with reviewer info (via LEFT JOIN)
  - Ordered by submission date (newest first)

#### `src/app/api/admin/submissions/[id]/approve/route.ts`
- **POST:** Approve submission and create project
  - Authenticated (admin or super admin)
  - Accepts project data in request body
  - Creates new project from submission + admin-provided fields
  - Marks submission as approved
  - Links submission to created project
  - Adds source URL as project source if provided
  - Returns created project ID

**Request Body:**
```json
{
  "projectData": {
    "title": "Project Title",
    "tier": "federal|state|lga",
    "mda": "Ministry/Department/Agency",
    "state": "State name",
    "sector": "Sector",
    "status": "planned"
  }
}
```

#### `src/app/api/admin/submissions/[id]/reject/route.ts`
- **POST:** Reject submission
  - Authenticated (admin or super admin)
  - Optional rejection reason
  - Marks submission as rejected
  - Records reviewer and timestamp

---

### 3. Admin Review UI

#### `src/app/admin/submissions/page.tsx`

**Features:**
- **Filter tabs:** Pending, Approved, Rejected, All
- **Submission cards** displaying:
  - Status badge (pending/approved/rejected)
  - Submission date and time
  - Full text content
  - Submitter name and contact (if provided)
  - Source URL link (if provided)
  - Reviewer info and date (for reviewed submissions)
  - Rejection reason (if rejected)

**Actions:**
- ✅ **Approve Button:** Opens approval form
- ❌ **Reject Button:** Opens rejection form

**Approval Form:**
- Displays submitted content for reference
- Fields: Title, Tier, MDA, State, Sector
- Pre-fills title from submission text
- Creates project on submit
- Shows success alert with project ID

**Rejection Form:**
- Optional rejection reason text area
- Marks submission as rejected
- Records reason for audit trail

**Security:**
- Accessible to all authenticated admins
- Redirects unauthenticated users to login

---

### 4. Dashboard Integration

#### `src/app/admin/page.tsx`
- Added "Review Submissions" link (green card)
- Available to all admins (not just super admins)
- Updated "Coming Soon" section

---

## Database Schema

Uses existing `pending_submissions` table from Phase 3:

```sql
CREATE TABLE pending_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  submission_type TEXT NOT NULL, -- 'new_project' | 'status_update' | 'budget_update' | 'correction'
  
  submitter_name TEXT,
  submitter_contact TEXT,
  
  claim_text TEXT NOT NULL,
  file_id UUID REFERENCES uploaded_files(id) ON DELETE SET NULL,
  source_url TEXT,
  
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  reviewed_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pending_submissions_status ON pending_submissions(status, submitted_at);
CREATE INDEX idx_pending_submissions_project ON pending_submissions(project_id);
```

---

## User Flows

### Public Submission Flow:
1. **Citizen visits public form** (to be built in future phase)
2. **Fills form:** Description, optional contact, source URL
3. **Submits** → Stored as pending submission
4. **Receives confirmation message**

### Admin Approval Flow:
1. **Admin logs in** and clicks "Review Submissions"
2. **Views pending submissions** (default tab)
3. **Clicks approve (✅)** on a submission
4. **Approval form appears** with submission content
5. **Admin fills project details:** Title, tier, MDA, state, sector
6. **Submits form** → Project created
7. **Submission marked as approved** and linked to project
8. **Source URL** automatically added as project source
9. **Alert shows** created project ID

### Admin Rejection Flow:
1. **Admin clicks reject (❌)** on a submission
2. **Rejection form appears**
3. **Optionally enters reason**
4. **Submits** → Submission marked as rejected
5. **Reason stored** for audit trail

---

## Security & Validation

### Public Submission:
- No authentication required (intentionally public)
- Content length limit: 5000 characters (prevents spam)
- Input sanitization on server-side
- Optional submitter info (not required)

### Admin Review:
- Authentication required for all routes
- Session validation on every request
- Only admins can approve/reject
- Cannot re-review already-reviewed submissions

### Data Integrity:
- Submissions can only be reviewed once (status check)
- Approved submissions linked to created projects
- Reviewer tracked for audit trail
- Timestamps recorded for all status changes

---

## Testing Checklist

### Public Submission (when form is built):
- [ ] Submit without authentication
- [ ] Submit with minimal info (just description)
- [ ] Submit with full info (name, contact, source)
- [ ] Try submitting >5000 characters (should fail)
- [ ] Receive success confirmation

### Admin Review:
- [ ] Access /admin/submissions as admin
- [ ] View pending submissions tab
- [ ] Approve a submission:
  - [ ] Fill project form
  - [ ] Verify project created
  - [ ] Check source URL added
  - [ ] Verify submission status changed
- [ ] Reject a submission:
  - [ ] Add rejection reason
  - [ ] Verify status changed to rejected
- [ ] Try to review same submission twice (should fail)
- [ ] Filter by approved submissions
- [ ] Filter by rejected submissions
- [ ] View "All" tab

---

## Files Changed

**Created:**
- `src/app/api/submissions/route.ts` (public POST)
- `src/app/api/admin/submissions/route.ts` (GET)
- `src/app/api/admin/submissions/[id]/approve/route.ts` (POST)
- `src/app/api/admin/submissions/[id]/reject/route.ts` (POST)
- `src/app/admin/submissions/page.tsx`
- `PHASE_5G_SUBMISSIONS_QUEUE.md`

**Modified:**
- `src/app/admin/page.tsx` (added Review Submissions link)

---

## Future Enhancements (Not in Phase 5g)

**Public Submission Form:**
- Build dedicated UI on main map for public submissions
- Add captcha/rate limiting for spam prevention
- Email confirmation to submitter
- Allow file uploads with submissions

**Admin Features:**
- Bulk approve/reject
- Assignment of submissions to specific admins
- Email notifications for new submissions
- Submission search/filter by keywords
- Export submissions to CSV

**Submission Types:**
- Status updates on existing projects
- Budget updates
- Corrections to project data
- Evidence/documentation uploads

---

## Phase 5 Complete! 🎉

All admin dashboard sub-phases complete:
- ✅ 5a: Project Management
- ✅ 5b: Budget Management
- ✅ 5c: Status Updates
- ✅ 5d: Source Management
- ✅ 5e: File Upload
- ✅ 5f: Admin Management
- ✅ 5g: Submissions Queue

---

## Next Phases

**Phase 6: File Parsing** (optional)
- Parse uploaded PDFs/Excel files
- Extract project data automatically
- OCR for scanned documents

**Phase 7: Public Submission Form**
- Build user-facing form on main map
- Integrate with Phase 5g API
- Add spam prevention (captcha/rate limiting)

**Phase 8: Nigeria Geography**
- State/LGA dropdowns with real data
- Map bounds focused on Nigeria
- Nigerian state/LGA boundaries overlay

**Phase 9: Analytics Dashboard**
- Project statistics by state, sector, status
- Budget analysis charts
- Timeline visualizations
- Export reports
