import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pendingSubmissions, admins } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/server-session';
import { desc, eq, or } from 'drizzle-orm';

// GET: List all pending submissions
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'all';

    let query = db
      .select({
        id: pendingSubmissions.id,
        submissionType: pendingSubmissions.submissionType,
        submitterName: pendingSubmissions.submitterName,
        submitterContact: pendingSubmissions.submitterContact,
        claimText: pendingSubmissions.claimText,
        sourceUrl: pendingSubmissions.sourceUrl,
        status: pendingSubmissions.status,
        reviewedBy: pendingSubmissions.reviewedBy,
        reviewedByName: admins.name,
        reviewedAt: pendingSubmissions.reviewedAt,
        rejectionReason: pendingSubmissions.rejectionReason,
        submittedAt: pendingSubmissions.submittedAt,
      })
      .from(pendingSubmissions)
      .leftJoin(admins, eq(pendingSubmissions.reviewedBy, admins.id))
      .orderBy(desc(pendingSubmissions.submittedAt));

    // Apply status filter
    if (statusFilter !== 'all') {
      query = query.where(eq(pendingSubmissions.status, statusFilter)) as any;
    }

    const submissions = await query;

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Failed to load submissions:', error);
    return NextResponse.json(
      { error: 'Failed to load submissions' },
      { status: 500 },
    );
  }
}
