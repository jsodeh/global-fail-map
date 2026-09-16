/**
 * GET /api/admin/projects - List projects with filtering
 * POST /api/admin/projects - Create new project
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/server-session';
import { eq, and, like, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const tier = searchParams.get('tier');
    const state = searchParams.get('state');
    const lga = searchParams.get('lga');
    const sector = searchParams.get('sector');
    const status = searchParams.get('status');

    let query = db.select().from(projects).orderBy(desc(projects.createdAt));

    // Apply filters
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(projects.title, `%${search}%`),
          like(projects.subtitle, `%${search}%`),
          like(projects.locationName, `%${search}%`),
        ),
      );
    }

    if (tier) conditions.push(eq(projects.tier, tier));
    if (state) conditions.push(eq(projects.state, state));
    if (lga) conditions.push(eq(projects.lga, lga));
    if (sector) conditions.push(eq(projects.sector, sector));
    if (status) conditions.push(eq(projects.status, status));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query;

    return NextResponse.json({ projects: result });
  } catch (error) {
    console.error('List projects error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list projects' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    // Validate required fields
    const required = ['title', 'tier', 'mda', 'sector', 'status', 'lat', 'lng', 'locationName'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 },
        );
      }
    }

    const [project] = await db
      .insert(projects)
      .values({
        ...body,
        createdBy: session.adminId,
      })
      .returning();

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create project' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}
