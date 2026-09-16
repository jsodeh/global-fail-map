/**
 * GET /api/admin/projects/[id]/status-updates/[updateId] - Get single status update
 * PATCH /api/admin/projects/[id]/status-updates/[updateId] - Update status update
 * DELETE /api/admin/projects/[id]/status-updates/[updateId] - Delete status update
 * 
 * Note: Updating/deleting does NOT re-sync project.status
 * The latest status_updates row always determines the current status via trigger
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { statusUpdates } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/server-session';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> },
) {
  try {
    await requireAuth();
    const { id, updateId } = await params;

    const [update] = await db
      .select()
      .from(statusUpdates)
      .where(
        and(
          eq(statusUpdates.id, updateId),
          eq(statusUpdates.projectId, id),
        ),
      )
      .limit(1);

    if (!update) {
      return NextResponse.json({ error: 'Status update not found' }, { status: 404 });
    }

    return NextResponse.json({ statusUpdate: update });
  } catch (error) {
    console.error('Get status update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get status update' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> },
) {
  try {
    await requireAuth();
    const { id, updateId } = await params;
    const body = await request.json();

    // Don't allow changing projectId or createdBy
    delete body.projectId;
    delete body.createdBy;
    delete body.createdAt;

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['planned', 'ongoing', 'completed', 'stalled', 'abandoned'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 },
        );
      }
    }

    const [update] = await db
      .update(statusUpdates)
      .set(body)
      .where(
        and(
          eq(statusUpdates.id, updateId),
          eq(statusUpdates.projectId, id),
        ),
      )
      .returning();

    if (!update) {
      return NextResponse.json({ error: 'Status update not found' }, { status: 404 });
    }

    return NextResponse.json({ statusUpdate: update });
  } catch (error) {
    console.error('Update status update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update status update' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> },
) {
  try {
    await requireAuth();
    const { id, updateId } = await params;

    const [deleted] = await db
      .delete(statusUpdates)
      .where(
        and(
          eq(statusUpdates.id, updateId),
          eq(statusUpdates.projectId, id),
        ),
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Status update not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete status update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete status update' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}
