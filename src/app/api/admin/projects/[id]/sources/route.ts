/**
 * GET /api/admin/projects/[id]/sources - List sources for a project
 * POST /api/admin/projects/[id]/sources - Add source
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projectSources, projects } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/server-session';
import { eq, desc, and } from 'drizzle-orm';

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

    // Get all sources for this project
    const sources = await db
      .select()
      .from(projectSources)
      .where(eq(projectSources.projectId, id))
      .orderBy(desc(projectSources.createdAt));

    return NextResponse.json({ sources });
  } catch (error) {
    console.error('List sources error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list sources' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
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
    if (!body.url || !body.title) {
      return NextResponse.json(
        { error: 'url and title are required' },
        { status: 400 },
      );
    }

    // Check for duplicate URL
    const [existing] = await db
      .select()
      .from(projectSources)
      .where(
        and(
          eq(projectSources.projectId, id),
          eq(projectSources.url, body.url),
        ),
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'This URL is already added to this project' },
        { status: 409 },
      );
    }

    const [source] = await db
      .insert(projectSources)
      .values({
        projectId: id,
        url: body.url,
        title: body.title,
      })
      .returning();

    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    console.error('Create source error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create source' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}
