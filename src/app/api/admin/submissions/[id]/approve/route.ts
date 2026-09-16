import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pendingSubmissions, projects } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/server-session';
import { eq } from 'drizzle-orm';

// POST: Approve a submission and create project
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
    const { projectData } = body;

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

    // Validate project data
    if (!projectData || !projectData.title || !projectData.tier || !projectData.mda) {
      return NextResponse.json(
        { error: 'Project title, tier, and MDA are required' },
        { status: 400 },
      );
    }

    // Create project from submission with required fields
    const [newProject] = await db
      .insert(projects)
      .values({
        title: projectData.title,
        subtitle: projectData.subtitle || null,
        reportContent: submission.claimText || '',
        tier: projectData.tier,
        mda: projectData.mda,
        state: projectData.state || null,
        lga: projectData.lga || null,
        sector: projectData.sector || 'General', // Required field, default to 'General'
        status: projectData.status || 'planned',
        lat: projectData.lat || '9.0820', // Default to Nigeria center
        lng: projectData.lng || '8.6753', // Default to Nigeria center
        locationName: projectData.locationName || projectData.state || 'Nigeria', // Required field
        locationRole: projectData.locationRole || null,
        contractorName: projectData.contractorName || null,
        contractorRegInfo: projectData.contractorRegInfo || null,
        fundingSource: projectData.fundingSource || null,
        startDate: projectData.startDate || null,
        expectedCompletion: projectData.expectedCompletion || null,
        revisedCompletion: projectData.revisedCompletion || null,
        confidence: projectData.confidence || 'moderate',
      })
      .returning();

    // Mark submission as approved
    await db
      .update(pendingSubmissions)
      .set({
        status: 'approved',
        reviewedBy: session.adminId,
        reviewedAt: new Date(),
        projectId: newProject.id,
      })
      .where(eq(pendingSubmissions.id, submissionId));

    // Add source URL if provided
    if (submission.sourceUrl) {
      const { projectSources } = await import('@/lib/db/schema');
      await db.insert(projectSources).values({
        projectId: newProject.id,
        url: submission.sourceUrl,
        title: 'Submitted by public',
      });
    }

    return NextResponse.json({
      success: true,
      projectId: newProject.id,
      message: 'Submission approved and project created',
    });
  } catch (error) {
    console.error('Failed to approve submission:', error);
    return NextResponse.json(
      { error: 'Failed to approve submission' },
      { status: 500 },
    );
  }
}
