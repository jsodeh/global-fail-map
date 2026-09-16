# Phase 3: Database Schema - Complete ✅

## What Was Built

### 1. **Database Schema** (`src/lib/db/schema.ts`)
- 7 tables with full TypeScript type inference
- Drizzle ORM definitions with relations
- Exported types for type-safe queries

### 2. **Initial Migration** (`drizzle/migrations/0000_initial_schema.sql`)
- Complete SQL migration with:
  - All table definitions
  - 16 performance indexes
  - 3 triggers (auto-update timestamps + status sync)
  - CHECK constraints for enums

### 3. **Database Client** (`src/lib/db/index.ts`)
- Postgres connection with pooling
- Drizzle instance export
- Environment validation

### 4. **Configuration** (`drizzle.config.ts`)
- Drizzle Kit configuration
- Migration path setup
- Database credentials from env

### 5. **Documentation** (`DATABASE.md`)
- Complete setup instructions
- Local & production deployment guides
- Query examples
- Troubleshooting tips

## Schema Design Decisions

### Tables

#### **admins**
- Email/password authentication (password_hash for bcrypt)
- Role field: `'admin'` | `'super_admin'`
- `is_active` for soft account disabling

#### **projects**
- **Embedded report content**: `report_content` TEXT column (not file-based)
- **Money fields**: `DECIMAL(18,2)` handles up to ₦999 quadrillion
- **Flexible classification**: TEXT fields for state/lga/sector (no CHECK constraints)
- **Tier system**: federal, state, lga
- **Status enum**: planned, ongoing, completed, stalled, abandoned

#### **project_budgets**
- Separate table for clarity (1:many with projects)
- Three amounts: appropriated, released, spent
- Source documentation required
- Fiscal year tracking

#### **status_updates**
- Historical status timeline
- **Auto-sync trigger**: inserting a row automatically updates `projects.status`
- Required source URL for every status change
- Preserves full audit trail

#### **project_sources**
- Many-to-many relationship with projects
- Unique constraint: no duplicate URLs per project

#### **uploaded_files**
- Vercel Blob storage references
- Nullable `project_id` for pending submissions
- File metadata (size, type, MIME type)

#### **pending_submissions**
- Public submission queue
- Four types: new_project, status_update, budget_update, correction
- Review workflow: pending → approved/rejected

### Key Features

1. **Auto-sync status trigger**
   ```sql
   -- When admin inserts status update:
   INSERT INTO status_updates VALUES (..., status = 'abandoned', ...);
   
   -- Trigger automatically runs:
   UPDATE projects SET status = 'abandoned', updated_at = now() WHERE ...;
   ```

2. **Timezone-aware timestamps**
   - All timestamps use `TIMESTAMPTZ`
   - Crucial for Nigeria (WAT = UTC+1)

3. **Soft foreign key deletes**
   - Admin references: `ON DELETE SET NULL`
   - Deleting an admin preserves their historical work
   - Only project children cascade delete

4. **Performance indexes**
   - All foreign keys indexed
   - Filter fields indexed (tier, state, lga, sector, status)
   - Geospatial index on lat/lng
   - Temporal indexes (created_at, date DESC)

## File Structure

```
progress-map/
├── src/lib/db/
│   ├── schema.ts           # Drizzle schema definitions
│   └── index.ts            # Database client export
├── drizzle/
│   ├── migrations/
│   │   ├── 0000_initial_schema.sql     # SQL migration
│   │   └── meta/                        # Drizzle metadata
│   │       ├── _journal.json
│   │       └── 0000_snapshot.json
├── drizzle.config.ts       # Drizzle Kit config
├── DATABASE.md             # Setup & usage guide
├── .env.example            # Updated with DATABASE_URL
└── package.json            # Added db:* scripts
```

## Dependencies Added

```json
{
  "dependencies": {
    "drizzle-orm": "^0.45.2",
    "postgres": "^3.4.9"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.10"
  }
}
```

## Scripts Added

```json
{
  "db:generate": "drizzle-kit generate",  // Generate migration from schema
  "db:migrate": "drizzle-kit migrate",    // Apply migrations
  "db:push": "drizzle-kit push",          // Push schema directly
  "db:studio": "drizzle-kit studio"       // Open database browser
}
```

## Verification

- ✅ TypeScript compilation passes (`pnpm typecheck`)
- ✅ Schema covers all requirements from implementation plan
- ✅ Money fields use `DECIMAL(18,2)` for Nigerian scale
- ✅ Status sync trigger implemented
- ✅ All indexes created
- ✅ Documentation complete

## Next Steps

### Immediate (User Action Required)

1. **Set up PostgreSQL database**
   - Local: `brew install postgresql@16 && createdb progress_map`
   - Or use Vercel Postgres / Railway / Supabase

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and set DATABASE_URL
   ```

3. **Run migration**
   ```bash
   pnpm db:push
   ```

4. **Verify tables created**
   ```bash
   psql $DATABASE_URL -c "\dt"
   ```

### Phase 4: Admin Authentication

Build admin login system:
- Bcrypt password hashing
- JWT/session-based auth
- Protected API routes
- Login/logout UI

### Phase 5: Admin Intake Forms

Build admin interface to:
- Create new projects
- Add budget data
- Record status updates
- Upload source documents
- Manage submissions queue

### Phase 6: File Upload Parsing

Implement PDF/Excel parsing:
- Extract budget figures from budget PDFs
- Parse project lists from Excel
- OCR for scanned documents (if needed)
- Validation & preview before save

### Phase 7: Public Submission Form

Build public-facing form:
- Submit new project suggestions
- Report status updates
- Upload supporting files
- Thank you + tracking number

### Phase 8: Geography Swap

Replace global map with Nigeria-focused:
- Nigeria state boundaries
- LGA boundaries (optional)
- Zoom to Nigeria bounds by default
- State/LGA labels

### Phase 9: Admin Dashboard

Build dashboard with:
- Project statistics by tier/sector/status
- Budget summaries (appropriated vs spent)
- Pending submissions queue
- Recent activity feed
- Export to CSV/Excel

## Questions Resolved

1. ✅ Admin auth: Proper `admins` table with roles
2. ✅ Report content: Stored in database (`report_content` column)
3. ✅ Categories: Dropped old 5 categories, using flexible `sector` field
4. ✅ Seed data: Starting with empty database (no import of 200 examples)
5. ✅ Money fields: `DECIMAL(18,2)` for Nigerian scale (trillions of Naira)
6. ✅ Status sync: Trigger auto-updates `projects.status` from `status_updates`

---

**Phase 3 Status**: Complete and ready for database setup ✅

**Build Status**: ✅ Passes (`pnpm build` successful)  
**TypeCheck Status**: ✅ Passes (`pnpm typecheck` successful)  
**archivi.ng**: ✅ Kept (Nigeria newspaper archive links)
