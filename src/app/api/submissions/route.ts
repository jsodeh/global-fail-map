import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pendingSubmissions } from '@/lib/db/schema';

// POST: Submit a new project suggestion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      submitterName,
      submitterContact,
      claimText,
      sourceUrl,
      submissionType = 'new_project',
    } = body;

    // Validate required fields
    if (!claimText || claimText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Project description is required' },
        { status: 400 },
      );
    }

    // Validate claim text length (prevent spam)
    if (claimText.length > 5000) {
      return NextResponse.json(
        { error: 'Description is too long (max 5000 characters)' },
        { status: 400 },
      );
    }

    // Validate submission type
    const validTypes = [
      'new_project',
      'status_update',
      'budget_update',
      'correction',
    ];
    if (!validTypes.includes(submissionType)) {
      return NextResponse.json(
        { error: 'Invalid submission type' },
        { status: 400 },
      );
    }

    // Create submission
    const [submission] = await db
      .insert(pendingSubmissions)
      .values({
        submissionType,
        submitterName: submitterName?.trim() || null,
        submitterContact: submitterContact?.trim() || null,
        claimText: claimText.trim(),
        sourceUrl: sourceUrl?.trim() || null,
        status: 'pending',
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        submissionId: submission.id,
        message: 'Thank you for your submission! It will be reviewed shortly.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Failed to create submission:', error);
    return NextResponse.json(
      { error: 'Failed to submit. Please try again.' },
      { status: 500 },
    );
  }
}
