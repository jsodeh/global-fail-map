import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { uploadedFiles } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/server-session';
import { eq, and, desc } from 'drizzle-orm';

// GET: List all files for a project
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

    const files = await db
      .select()
      .from(uploadedFiles)
      .where(eq(uploadedFiles.projectId, projectId))
      .orderBy(desc(uploadedFiles.uploadedAt));

    return NextResponse.json(files);
  } catch (error) {
    console.error('Failed to load files:', error);
    return NextResponse.json(
      { error: 'Failed to load files' },
      { status: 500 },
    );
  }
}

// POST: Upload a new file
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

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Only PDF, Excel, Word, and images are allowed.',
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

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
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
    console.error('Failed to upload file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 },
    );
  }
}
