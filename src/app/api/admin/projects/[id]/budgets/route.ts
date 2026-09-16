/**
 * GET /api/admin/projects/[projectId]/budgets - List budgets for a project
 * POST /api/admin/projects/[projectId]/budgets - Add budget entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projectBudgets, projects } from '@/lib/db/schema';
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

    // Get all budgets for this project
    const budgets = await db
      .select()
      .from(projectBudgets)
      .where(eq(projectBudgets.projectId, id))
      .orderBy(desc(projectBudgets.fiscalYear), desc(projectBudgets.createdAt));

    return NextResponse.json({ budgets });
  } catch (error) {
    console.error('List budgets error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list budgets' },
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
    if (!body.sourceUrl) {
      return NextResponse.json(
        { error: 'sourceUrl is required' },
        { status: 400 },
      );
    }

    const [budget] = await db
      .insert(projectBudgets)
      .values({
        projectId: id,
        appropriated: body.appropriated || null,
        released: body.released || null,
        spent: body.spent || null,
        sourceUrl: body.sourceUrl,
        sourceTitle: body.sourceTitle || null,
        fiscalYear: body.fiscalYear || null,
        budgetLine: body.budgetLine || null,
        createdBy: session.adminId,
      })
      .returning();

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    console.error('Create budget error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create budget' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}
