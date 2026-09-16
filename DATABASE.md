# Progress Map - Database Setup

## Overview

Progress Map uses PostgreSQL for data storage with Drizzle ORM for type-safe database access.

## Database Schema

### Tables

1. **`admins`** - Admin user accounts with email/password authentication
2. **`projects`** - Main project records with embedded report content
3. **`project_budgets`** - Budget breakdown (appropriated, released, spent)
4. **`status_updates`** - Historical status changes with sources
5. **`project_sources`** - Source URLs for projects
6. **`uploaded_files`** - Vercel Blob file references (PDFs, Excel, etc.)
7. **`pending_submissions`** - Public submission queue for review

### Key Features

- **Money fields**: `DECIMAL(18, 2)` to handle Nigerian projects up to ₦999 quadrillion
- **Auto-sync status**: Trigger automatically updates `projects.status` when new `status_updates` row is inserted
- **Timezone-aware**: All timestamps use `TIMESTAMPTZ` (Nigeria: WAT = UTC+1)
- **Soft deletes**: Admin references use `ON DELETE SET NULL` to preserve history
- **Cascade deletes**: Project children cascade properly on project deletion

## Setup Instructions

### 1. Install Dependencies

Already done if you followed Phase 3 setup:

```bash
pnpm install
```

### 2. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL (macOS with Homebrew)

```bash
# Install PostgreSQL
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Create database
createdb progress_map

# Get connection string
echo "postgresql://$(whoami)@localhost:5432/progress_map"
```

#### Option B: Neon via Vercel Marketplace (Recommended for deployment)

**Note**: Vercel Postgres was deprecated in 2025. Use Neon through the Vercel Marketplace instead.

1. Go to your Vercel project dashboard
2. Navigate to **Storage** tab
3. Click **Marketplace**
4. Select **Neon** (Serverless Postgres)
5. Click **Add Integration** and follow the setup
6. Copy the `DATABASE_URL` from your Vercel environment variables

#### Option C: Direct Neon, Railway, or Supabase

Follow their respective setup guides and obtain a `DATABASE_URL` connection string:
- **Neon**: https://neon.tech (Serverless Postgres with free tier)
- **Railway**: https://railway.app (Simple deployment platform)
- **Supabase**: https://supabase.com (Open source Firebase alternative)

### 3. Configure Environment Variables

Create `.env.local` in the project root:

```bash
# Copy from example
cp .env.example .env.local

# Edit .env.local and set your DATABASE_URL
DATABASE_URL=postgresql://user:password@host:5432/progress_map
```

**Important**: Never commit `.env.local` to git (already in `.gitignore`).

### 4. Run Database Migration

```bash
# Apply the migration to create all tables, indexes, and triggers
pnpm db:push
```

This will:
- Create all 7 tables
- Add 16 indexes for query performance
- Set up 3 triggers (auto-update timestamps, sync project status)

### 5. Verify Migration

Check your database:

```bash
# Using psql
psql $DATABASE_URL -c "\dt"

# Should show 7 tables:
# - admins
# - projects
# - project_budgets
# - status_updates
# - project_sources
# - uploaded_files
# - pending_submissions
```

### 6. Explore Database (Optional)

Drizzle Kit includes a built-in database browser:

```bash
pnpm db:studio
```

Opens at `https://local.drizzle.studio` - browse tables, view data, run queries.

## Database Scripts

Available in `package.json`:

```bash
# Generate new migration from schema changes
pnpm db:generate

# Push schema directly to database (no migration files)
pnpm db:push

# Apply pending migrations
pnpm db:migrate

# Open Drizzle Studio (database browser)
pnpm db:studio
```

## Usage in Code

### Import the database client

```typescript
import { db } from '@/lib/db';
import { projects, type NewProject } from '@/lib/db/schema';
```

### Query examples

```typescript
// Select all projects
const allProjects = await db.select().from(projects);

// Select by status
const abandonedProjects = await db
  .select()
  .from(projects)
  .where(eq(projects.status, 'abandoned'));

// Insert new project
const newProject: NewProject = {
  title: 'Lagos-Ibadan Expressway Rehabilitation',
  tier: 'federal',
  mda: 'Federal Ministry of Works',
  sector: 'roads',
  status: 'ongoing',
  lat: '6.5244',
  lng: '3.3792',
  locationName: 'Lagos-Ibadan Corridor',
  // ... other fields
};

await db.insert(projects).values(newProject);
```

### Status sync example

```typescript
import { statusUpdates } from '@/lib/db/schema';

// Insert status update - trigger automatically updates projects.status
await db.insert(statusUpdates).values({
  projectId: 'some-uuid',
  status: 'abandoned',
  date: '2026-01-15',
  note: 'Contractor abandoned site after 6 months of inactivity',
  sourceUrl: 'https://example.com/news-article',
  sourceTitle: 'Lagos Project Abandoned',
  createdBy: adminId,
});

// projects.status is now 'abandoned' automatically (via trigger)
```

## Schema Changes

When you modify `src/lib/db/schema.ts`:

1. Generate migration:
   ```bash
   pnpm db:generate
   ```

2. Review the generated SQL in `drizzle/migrations/`

3. Apply to database:
   ```bash
   pnpm db:push
   ```

## Troubleshooting

### "DATABASE_URL is not set"

- Ensure `.env.local` exists with `DATABASE_URL`
- Check it's not named `.env` (use `.env.local` for Next.js)

### Connection timeout

- Verify PostgreSQL is running: `brew services list`
- Check firewall isn't blocking port 5432
- Test connection: `psql $DATABASE_URL`

### Migration fails

- Check PostgreSQL version (requires 12+): `psql --version`
- Verify user has CREATE permission: `psql $DATABASE_URL -c "SELECT current_user;"`
- Drop and recreate database if needed: `dropdb progress_map && createdb progress_map`

## Production Deployment

### Vercel (with Neon via Marketplace)

1. Add Neon integration via Vercel Marketplace: **Storage** → **Marketplace** → **Neon**
2. `DATABASE_URL` is automatically added to Vercel environment variables
3. Run migration locally first: `pnpm db:push`
4. Deploy: `vercel deploy`

**Note**: Vercel doesn't run migrations automatically. Apply migrations locally or via CI before deploying.

### Manual Migration on Production

If you prefer to run migrations on the production database:

```bash
# Set production DATABASE_URL temporarily
export DATABASE_URL=postgresql://prod-user:password@prod-host:5432/progress_map

# Apply migration
pnpm db:push

# Unset
unset DATABASE_URL
```

## Security Notes

- **Never commit** `.env.local` or production `DATABASE_URL`
- Use **read-only database users** for public-facing queries if possible
- Admin password hashes use bcrypt (implement in auth layer, not included in schema)
- Vercel Blob URLs are signed with expiration for uploaded files

## Next Steps

After database setup:

1. **Phase 4**: Implement admin authentication (bcrypt, JWT, login/logout)
2. **Phase 5**: Build admin intake forms for projects
3. **Phase 6**: Implement file upload parsing (PDF → structured data)
4. **Phase 7**: Create public submission form
5. **Phase 8**: Swap geography to Nigeria boundaries
6. **Phase 9**: Build admin dashboard

---

**Phase 3 Complete**: Database schema designed and migrations generated ✅
