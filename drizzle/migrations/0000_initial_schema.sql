-- Progress Map - Initial Database Schema
-- PostgreSQL migration for Nigeria government projects tracker

-- ============================================================================
-- TABLES
-- ============================================================================

-- Admins table
CREATE TABLE IF NOT EXISTS "admins" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'admin',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projects table
CREATE TABLE IF NOT EXISTS "projects" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic information
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "report_content" TEXT,
  
  -- Government classification
  "tier" TEXT NOT NULL CHECK ("tier" IN ('federal', 'state', 'lga')),
  "mda" TEXT NOT NULL,
  "state" TEXT,
  "lga" TEXT,
  "sector" TEXT NOT NULL,
  
  -- Status
  "status" TEXT NOT NULL CHECK ("status" IN ('planned', 'ongoing', 'completed', 'stalled', 'abandoned')),
  
  -- Location
  "lat" DECIMAL(10, 8) NOT NULL,
  "lng" DECIMAL(11, 8) NOT NULL,
  "location_name" TEXT NOT NULL,
  "location_role" TEXT,
  
  -- Project parties
  "contractor_name" TEXT,
  "contractor_reg_info" TEXT,
  
  -- Financing
  "funding_source" TEXT,
  
  -- Timeline
  "start_date" DATE,
  "expected_completion" DATE,
  "revised_completion" DATE,
  
  -- Metadata
  "confidence" TEXT NOT NULL DEFAULT 'moderate' CHECK ("confidence" IN ('high', 'moderate', 'low')),
  "created_by" UUID REFERENCES "admins"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project budgets table
CREATE TABLE IF NOT EXISTS "project_budgets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  
  -- Budget figures in Nigerian Naira (handles trillions: DECIMAL(18,2))
  "appropriated" DECIMAL(18, 2),
  "released" DECIMAL(18, 2),
  "spent" DECIMAL(18, 2),
  
  -- Source documentation
  "source_url" TEXT NOT NULL,
  "source_title" TEXT,
  
  -- Fiscal context
  "fiscal_year" INTEGER,
  "budget_line" TEXT,
  
  "created_by" UUID REFERENCES "admins"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Status updates table
CREATE TABLE IF NOT EXISTS "status_updates" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  
  "status" TEXT NOT NULL CHECK ("status" IN ('planned', 'ongoing', 'completed', 'stalled', 'abandoned')),
  "date" DATE NOT NULL,
  "note" TEXT NOT NULL,
  
  -- Source documentation (required)
  "source_url" TEXT NOT NULL,
  "source_title" TEXT,
  
  "created_by" UUID REFERENCES "admins"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project sources table
CREATE TABLE IF NOT EXISTS "project_sources" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  
  "url" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT "unique_project_url" UNIQUE ("project_id", "url")
);

-- Uploaded files table
CREATE TABLE IF NOT EXISTS "uploaded_files" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" UUID REFERENCES "projects"("id") ON DELETE CASCADE,
  
  "file_name" TEXT NOT NULL,
  "file_type" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL,
  "mime_type" TEXT NOT NULL,
  
  -- Vercel Blob storage
  "storage_key" TEXT NOT NULL UNIQUE,
  "storage_url" TEXT NOT NULL,
  
  "uploaded_by" UUID REFERENCES "admins"("id") ON DELETE SET NULL,
  "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pending submissions table
CREATE TABLE IF NOT EXISTS "pending_submissions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" UUID REFERENCES "projects"("id") ON DELETE CASCADE,
  
  -- Submission type
  "submission_type" TEXT NOT NULL CHECK ("submission_type" IN ('new_project', 'status_update', 'budget_update', 'correction')),
  
  -- Submitter info (optional)
  "submitter_name" TEXT,
  "submitter_contact" TEXT,
  
  -- Content
  "claim_text" TEXT NOT NULL,
  "file_id" UUID REFERENCES "uploaded_files"("id") ON DELETE SET NULL,
  "source_url" TEXT,
  
  -- Review workflow
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'approved', 'rejected')),
  "reviewed_by" UUID REFERENCES "admins"("id") ON DELETE SET NULL,
  "reviewed_at" TIMESTAMPTZ,
  "rejection_reason" TEXT,
  
  "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Admins indexes
CREATE INDEX IF NOT EXISTS "idx_admins_email" ON "admins"("email");
CREATE INDEX IF NOT EXISTS "idx_admins_active" ON "admins"("is_active");

-- Projects indexes
CREATE INDEX IF NOT EXISTS "idx_projects_tier" ON "projects"("tier");
CREATE INDEX IF NOT EXISTS "idx_projects_state" ON "projects"("state");
CREATE INDEX IF NOT EXISTS "idx_projects_lga" ON "projects"("lga");
CREATE INDEX IF NOT EXISTS "idx_projects_sector" ON "projects"("sector");
CREATE INDEX IF NOT EXISTS "idx_projects_status" ON "projects"("status");
CREATE INDEX IF NOT EXISTS "idx_projects_created_at" ON "projects"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_projects_location" ON "projects"("lat", "lng");

-- Project budgets indexes
CREATE INDEX IF NOT EXISTS "idx_project_budgets_project" ON "project_budgets"("project_id");
CREATE INDEX IF NOT EXISTS "idx_project_budgets_fiscal_year" ON "project_budgets"("fiscal_year");

-- Status updates indexes
CREATE INDEX IF NOT EXISTS "idx_status_updates_project_date" ON "status_updates"("project_id", "date" DESC);

-- Project sources indexes
CREATE INDEX IF NOT EXISTS "idx_project_sources_project" ON "project_sources"("project_id");

-- Uploaded files indexes
CREATE INDEX IF NOT EXISTS "idx_uploaded_files_project" ON "uploaded_files"("project_id");
CREATE INDEX IF NOT EXISTS "idx_uploaded_files_uploaded_at" ON "uploaded_files"("uploaded_at" DESC);

-- Pending submissions indexes
CREATE INDEX IF NOT EXISTS "idx_pending_submissions_status" ON "pending_submissions"("status", "submitted_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_pending_submissions_project" ON "pending_submissions"("project_id");

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update admins.updated_at on UPDATE
CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON "admins"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update projects.updated_at on UPDATE
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON "projects"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Automatically sync project status when status_updates is inserted
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

-- Trigger: Sync project status on status_updates INSERT
CREATE TRIGGER sync_project_status_on_insert
  AFTER INSERT ON "status_updates"
  FOR EACH ROW
  EXECUTE FUNCTION sync_project_status();
