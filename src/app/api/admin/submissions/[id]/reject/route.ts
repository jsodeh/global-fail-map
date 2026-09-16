import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pendingSubmissions } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/server-session';
import { eq } from 'drizzle-orm';

// POST: Reject a submission
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: submissionId } = await context.params;
    const body = await request.json();
    const { reason } = body;

    // Get submission
    const [submission] = await db
      .select()
      .from(pendingSubmissions)
      .where(eq(pendingSubmissions.id, submissionId));

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 },
      );
    }

    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: 'Submission has already been reviewed' },
        { status: 400 },
      );
    }

    // Mark submission as rejected
    await db
      .update(pendingSubmissions)
      .set({
        status: 'rejected',
        reviewedBy: session.adminId,
        reviewedAt: new Date(),
        rejectionReason: reason?.trim() || null,
      })
      .where(eq(pendingSubmissions.id, submissionId));

    return NextResponse.json({
      success: true,
      message: 'Submission rejected',
    });
  } catch (error) {
    console.error('Failed to reject submission:', error);
    return NextResponse.json(
      { error: 'Failed to reject submission' },
      { status: 500 },
    );
  }
}
