/**
 * Progress Map - Database Schema
 * PostgreSQL schema for Nigeria government projects tracker
 */

import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  decimal,
  date,
  integer,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============================================================================
// ADMINS
// ============================================================================

export const admins = pgTable(
  'admins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    role: text('role').notNull().default('admin'), // 'admin' | 'super_admin'
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailIdx: index('idx_admins_email').on(table.email),
    activeIdx: index('idx_admins_active').on(table.isActive),
  }),
);

// ============================================================================
// PROJECTS
// ============================================================================

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Basic information
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    reportContent: text('report_content'), // Markdown report

    // Government classification
    tier: text('tier').notNull(), // 'federal' | 'state' | 'lga'
    mda: text('mda').notNull(), // Ministry/Department/Agency
    state: text('state'), // One of 36 states + FCT
    lga: text('lga'), // One of 774 LGAs
    sector: text('sector').notNull(), // roads, power, health, education, water, etc.

    // Status
    status: text('status').notNull(), // 'planned' | 'ongoing' | 'completed' | 'stalled' | 'abandoned'

    // Location
    lat: decimal('lat', { precision: 10, scale: 8 }).notNull(),
    lng: decimal('lng', { precision: 11, scale: 8 }).notNull(),
    locationName: text('location_name').notNull(),
    locationRole: text('location_role'), // e.g., "Project site", "Headquarters"

    // Project parties
    contractorName: text('contractor_name'),
    contractorRegInfo: text('contractor_reg_info'), // CAC registration, TIN, etc.

    // Financing
    fundingSource: text('funding_source'), // e.g., "2023 Federal Budget - Health Sector"

    // Timeline
    startDate: date('start_date'),
    expectedCompletion: date('expected_completion'),
    revisedCompletion: date('revised_completion'),

    // Metadata
    confidence: text('confidence').notNull().default('moderate'), // 'high' | 'moderate' | 'low'
    createdBy: uuid('created_by').references(() => admins.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tierIdx: index('idx_projects_tier').on(table.tier),
    stateIdx: index('idx_projects_state').on(table.state),
    lgaIdx: index('idx_projects_lga').on(table.lga),
    sectorIdx: index('idx_projects_sector').on(table.sector),
    statusIdx: index('idx_projects_status').on(table.status),
    createdAtIdx: index('idx_projects_created_at').on(table.createdAt),
    locationIdx: index('idx_projects_location').on(table.lat, table.lng),
  }),
);

// ============================================================================
// PROJECT BUDGETS
// ============================================================================

export const projectBudgets = pgTable(
  'project_budgets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),

    // Budget figures in Nigerian Naira (handles trillions)
    appropriated: decimal('appropriated', { precision: 18, scale: 2 }),
    released: decimal('released', { precision: 18, scale: 2 }),
    spent: decimal('spent', { precision: 18, scale: 2 }),

    // Source documentation
    sourceUrl: text('source_url').notNull(),
    sourceTitle: text('source_title'),

    // Fiscal context
    fiscalYear: integer('fiscal_year'),
    budgetLine: text('budget_line'), // e.g., "MDA Code 12345 - Capital Expenditure"

    createdBy: uuid('created_by').references(() => admins.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectIdx: index('idx_project_budgets_project').on(table.projectId),
    fiscalYearIdx: index('idx_project_budgets_fiscal_year').on(
      table.fiscalYear,
    ),
  }),
);

// ============================================================================
// STATUS UPDATES
// ============================================================================

export const statusUpdates = pgTable(
  'status_updates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),

    status: text('status').notNull(), // 'planned' | 'ongoing' | 'completed' | 'stalled' | 'abandoned'
    date: date('date').notNull(), // When this status took effect
    note: text('note').notNull(), // What happened

    // Source documentation (required)
    sourceUrl: text('source_url').notNull(),
    sourceTitle: text('source_title'),

    createdBy: uuid('created_by').references(() => admins.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectDateIdx: index('idx_status_updates_project_date').on(
      table.projectId,
      table.date,
    ),
  }),
);

// ============================================================================
// PROJECT SOURCES
// ============================================================================

export const projectSources = pgTable(
  'project_sources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),

    url: text('url').notNull(),
    title: text('title').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectIdx: index('idx_project_sources_project').on(table.projectId),
    uniqueProjectUrl: unique('unique_project_url').on(
      table.projectId,
      table.url,
    ),
  }),
);

// ============================================================================
// UPLOADED FILES
// ============================================================================

export const uploadedFiles = pgTable(
  'uploaded_files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').references(() => projects.id, {
      onDelete: 'cascade',
    }), // Nullable for pending submissions

    fileName: text('file_name').notNull(),
    fileType: text('file_type').notNull(), // pdf, xlsx, docx, txt, csv
    fileSize: integer('file_size').notNull(), // bytes
    mimeType: text('mime_type').notNull(),

    // Vercel Blob storage
    storageKey: text('storage_key').notNull().unique(),
    storageUrl: text('storage_url').notNull(),

    uploadedBy: uuid('uploaded_by').references(() => admins.id, {
      onDelete: 'set null',
    }),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectIdx: index('idx_uploaded_files_project').on(table.projectId),
    uploadedAtIdx: index('idx_uploaded_files_uploaded_at').on(
      table.uploadedAt,
    ),
  }),
);

// ============================================================================
// PENDING SUBMISSIONS
// ============================================================================

export const pendingSubmissions = pgTable(
  'pending_submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').references(() => projects.id, {
      onDelete: 'cascade',
    }), // Nullable if suggesting new project

    // Submission type
    submissionType: text('submission_type').notNull(), // 'new_project' | 'status_update' | 'budget_update' | 'correction'

    // Submitter info (optional)
    submitterName: text('submitter_name'),
    submitterContact: text('submitter_contact'), // email or phone

    // Content
    claimText: text('claim_text').notNull(), // What they're reporting
    fileId: uuid('file_id').references(() => uploadedFiles.id, {
      onDelete: 'set null',
    }),
    sourceUrl: text('source_url'),

    // Review workflow
    status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
    reviewedBy: uuid('reviewed_by').references(() => admins.id, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),

    submittedAt: timestamp('submitted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    statusIdx: index('idx_pending_submissions_status').on(
      table.status,
      table.submittedAt,
    ),
    projectIdx: index('idx_pending_submissions_project').on(table.projectId),
  }),
);

// ============================================================================
// TYPES (for TypeScript inference)
// ============================================================================

export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type ProjectBudget = typeof projectBudgets.$inferSelect;
export type NewProjectBudget = typeof projectBudgets.$inferInsert;

export type StatusUpdate = typeof statusUpdates.$inferSelect;
export type NewStatusUpdate = typeof statusUpdates.$inferInsert;

export type ProjectSource = typeof projectSources.$inferSelect;
export type NewProjectSource = typeof projectSources.$inferInsert;

export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type NewUploadedFile = typeof uploadedFiles.$inferInsert;

export type PendingSubmission = typeof pendingSubmissions.$inferSelect;
export type NewPendingSubmission = typeof pendingSubmissions.$inferInsert;
