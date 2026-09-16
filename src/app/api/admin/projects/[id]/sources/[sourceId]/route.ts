/**
 * GET /api/admin/projects/[id]/sources/[sourceId] - Get single source
 * PATCH /api/admin/projects/[id]/sources/[sourceId] - Update source
 * DELETE /api/admin/projects/[id]/sources/[sourceId] - Delete source
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projectSources } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/server-session';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sourceId: string }> },
) {
  try {
    await requireAuth();
    const { id, sourceId } = await params;

    const [source] = await db
      .select()
      .from(projectSources)
      .where(
        and(
          eq(projectSources.id, sourceId),
          eq(projectSources.projectId, id),
        ),
      )
      .limit(1);

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    return NextResponse.json({ source });
  } catch (error) {
    console.error('Get source error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get source' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sourceId: string }> },
) {
  try {
    await requireAuth();
    const { id, sourceId } = await params;
    const body = await request.json();

    // Don't allow changing projectId
    delete body.projectId;
    delete body.createdAt;

    const [source] = await db
      .update(projectSources)
      .set(body)
      .where(
        and(
          eq(projectSources.id, sourceId),
          eq(projectSources.projectId, id),
        ),
      )
      .returning();

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    return NextResponse.json({ source });
  } catch (error) {
    console.error('Update source error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update source' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sourceId: string }> },
) {
  try {
    await requireAuth();
    const { id, sourceId } = await params;

    const [deleted] = await db
      .delete(projectSources)
      .where(
        and(
          eq(projectSources.id, sourceId),
          eq(projectSources.projectId, id),
        ),
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete source error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete source' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}
