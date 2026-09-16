import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { uploadedFiles } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/server-session';
import { eq, and, desc } from 'drizzle-orm';

// GET: List all media (images only) for a project
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await context.params;

    // Only fetch image files
    const files = await db
      .select()
      .from(uploadedFiles)
      .where(
        and(
          eq(uploadedFiles.projectId, projectId),
          // Filter for image mime types
          // Using SQL LIKE since Drizzle doesn't have a built-in starts-with
        ),
      )
      .orderBy(desc(uploadedFiles.uploadedAt));

    // Filter images in application code
    const imageFiles = files.filter((file) =>
      file.fileType.startsWith('image/')
    );

    return NextResponse.json(imageFiles);
  } catch (error) {
    console.error('Failed to load media:', error);
    return NextResponse.json(
      { error: 'Failed to load media' },
      { status: 500 },
    );
  }
}

// POST: Upload a new image
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await context.params;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type - images only
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type. Only JPG, PNG, and WebP images are allowed.',
        },
        { status: 400 },
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 },
      );
    }

    // Upload to Vercel Blob with media-specific folder
    const blob = await put(`projects/${projectId}/media/${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    // Save metadata to database
    const [uploadedFile] = await db
      .insert(uploadedFiles)
      .values({
        projectId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        mimeType: file.type,
        storageKey: blob.pathname,
        storageUrl: blob.url,
        uploadedBy: session.adminId,
      })
      .returning();

    return NextResponse.json(uploadedFile, { status: 201 });
  } catch (error) {
    console.error('Failed to upload media:', error);
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 },
    );
  }
}
