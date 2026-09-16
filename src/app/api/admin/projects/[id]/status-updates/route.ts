/**
 * GET /api/admin/projects/[id]/status-updates - List status updates for a project
 * POST /api/admin/projects/[id]/status-updates - Add status update
 * 
 * Note: POST automatically updates projects.status via database trigger
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { statusUpdates, projects } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/server-session';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;

    // Verify project exists
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get all status updates for this project (newest first)
    const updates = await db
      .select()
      .from(statusUpdates)
      .where(eq(statusUpdates.projectId, id))
      .orderBy(desc(statusUpdates.date), desc(statusUpdates.createdAt));

    return NextResponse.json({ statusUpdates: updates });
  } catch (error) {
    console.error('List status updates error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list status updates' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    // Verify project exists
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Validate required fields
    if (!body.status || !body.date || !body.note || !body.sourceUrl) {
      return NextResponse.json(
        { error: 'status, date, note, and sourceUrl are required' },
        { status: 400 },
      );
    }

    // Validate status value
    const validStatuses = ['planned', 'ongoing', 'completed', 'stalled', 'abandoned'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 },
      );
    }

    // Insert status update
    // The database trigger will automatically update projects.status
    const [statusUpdate] = await db
      .insert(statusUpdates)
      .values({
        projectId: id,
        status: body.status,
        date: body.date,
        note: body.note,
        sourceUrl: body.sourceUrl,
        sourceTitle: body.sourceTitle || null,
        createdBy: session.adminId,
      })
      .returning();

    return NextResponse.json({ statusUpdate }, { status: 201 });
  } catch (error) {
    console.error('Create status update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create status update' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}
