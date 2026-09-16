/**
 * GET /api/projects - Public API to list approved projects with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq, and, like, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
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
          like(projects.mda, `%${search}%`),
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

    // Return simplified project data for public consumption
    const publicProjects = result.map((project) => ({
      id: project.id,
      title: project.title,
      subtitle: project.subtitle,
      tier: project.tier,
      mda: project.mda,
      state: project.state,
      lga: project.lga,
      sector: project.sector,
      status: project.status,
      lat: project.lat,
      lng: project.lng,
      locationName: project.locationName,
      reportContent: project.reportContent,
      fundingSource: project.fundingSource,
      contractorName: project.contractorName,
      startDate: project.startDate,
      expectedCompletion: project.expectedCompletion,
      revisedCompletion: project.revisedCompletion,
      confidence: project.confidence,
      createdAt: project.createdAt,
    }));

    return NextResponse.json({ projects: publicProjects });
  } catch (error) {
    console.error('List public projects error:', error);
    return NextResponse.json(
      { error: 'Failed to list projects' },
      { status: 500 },
    );
  }
}
