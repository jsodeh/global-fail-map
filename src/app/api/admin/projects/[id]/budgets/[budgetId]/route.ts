/**
 * GET /api/admin/projects/[id]/budgets/[budgetId] - Get single budget
 * PATCH /api/admin/projects/[id]/budgets/[budgetId] - Update budget
 * DELETE /api/admin/projects/[id]/budgets/[budgetId] - Delete budget
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projectBudgets } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/server-session';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; budgetId: string }> },
) {
  try {
    await requireAuth();
    const { id, budgetId } = await params;

    const [budget] = await db
      .select()
      .from(projectBudgets)
      .where(
        and(
          eq(projectBudgets.id, budgetId),
          eq(projectBudgets.projectId, id),
        ),
      )
      .limit(1);

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    return NextResponse.json({ budget });
  } catch (error) {
    console.error('Get budget error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get budget' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; budgetId: string }> },
) {
  try {
    await requireAuth();
    const { id, budgetId } = await params;
    const body = await request.json();

    // Don't allow changing projectId or createdBy
    delete body.projectId;
    delete body.createdBy;
    delete body.createdAt;

    const [budget] = await db
      .update(projectBudgets)
      .set(body)
      .where(
        and(
          eq(projectBudgets.id, budgetId),
          eq(projectBudgets.projectId, id),
        ),
      )
      .returning();

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    return NextResponse.json({ budget });
  } catch (error) {
    console.error('Update budget error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update budget' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; budgetId: string }> },
) {
  try {
    await requireAuth();
    const { id, budgetId } = await params;

    const [deleted] = await db
      .delete(projectBudgets)
      .where(
        and(
          eq(projectBudgets.id, budgetId),
          eq(projectBudgets.projectId, id),
        ),
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete budget error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete budget' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}
