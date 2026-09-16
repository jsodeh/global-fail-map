/**
 * GET /api/admin/stats - Get statistics summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, submissions } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/server-session';
import { eq, sql, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    // Get project counts by status
    const projectStats = await db
      .select({
        status: projects.status,
        count: sql<number>`count(*)::int`,
      })
      .from(projects)
      .groupBy(projects.status);

    // Get project counts by tier
    const tierStats = await db
      .select({
        tier: projects.tier,
        count: sql<number>`count(*)::int`,
      })
      .from(projects)
      .groupBy(projects.tier);

    // Get project counts by state (top 10)
    const stateStats = await db
      .select({
        state: projects.state,
        count: sql<number>`count(*)::int`,
      })
      .from(projects)
      .where(sql`${projects.state} IS NOT NULL AND ${projects.state} != ''`)
      .groupBy(projects.state)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    // Get submission counts by status
    const submissionStats = await db
      .select({
        status: submissions.status,
        count: sql<number>`count(*)::int`,
      })
      .from(submissions)
      .groupBy(submissions.status);

    // Get total counts
    const [totalProjects] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects);

    const [totalSubmissions] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(submissions);

    return NextResponse.json({
      projects: {
        total: totalProjects.count,
        byStatus: Object.fromEntries(
          projectStats.map((s) => [s.status, s.count])
        ),
        byTier: Object.fromEntries(
          tierStats.map((t) => [t.tier, t.count])
        ),
        topStates: stateStats,
      },
      submissions: {
        total: totalSubmissions.count,
        byStatus: Object.fromEntries(
          submissionStats.map((s) => [s.status, s.count])
        ),
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get stats' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}
