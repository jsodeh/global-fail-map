/**
 * GET /api/projects/[id]/media - Public API to get project media
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { uploadedFiles } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await context.params;

    // Fetch only image files for this project
    const files = await db
      .select({
        id: uploadedFiles.id,
        fileName: uploadedFiles.fileName,
        fileType: uploadedFiles.fileType,
        fileSize: uploadedFiles.fileSize,
        storageUrl: uploadedFiles.storageUrl,
        uploadedAt: uploadedFiles.uploadedAt,
      })
      .from(uploadedFiles)
      .where(eq(uploadedFiles.projectId, projectId))
      .orderBy(desc(uploadedFiles.uploadedAt));

    // Filter for images only
    const imageFiles = files.filter((file) =>
      file.fileType.startsWith('image/')
    );

    return NextResponse.json(imageFiles);
  } catch (error) {
    console.error('Failed to load project media:', error);
    return NextResponse.json(
      { error: 'Failed to load media' },
      { status: 500 },
    );
  }
}
