import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { db } from '@/lib/db';
import { uploadedFiles } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/server-session';
import { eq, and } from 'drizzle-orm';

// DELETE: Remove a media file
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; mediaId: string }> },
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, mediaId } = await context.params;

    // Get file info first
    const [file] = await db
      .select()
      .from(uploadedFiles)
      .where(
        and(
          eq(uploadedFiles.id, mediaId),
          eq(uploadedFiles.projectId, projectId),
        ),
      );

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete from Vercel Blob
    try {
      await del(file.storageUrl);
    } catch (blobError) {
      console.error('Failed to delete from blob storage:', blobError);
      // Continue anyway - we'll delete the DB record
    }

    // Delete from database
    await db
      .delete(uploadedFiles)
      .where(
        and(
          eq(uploadedFiles.id, mediaId),
          eq(uploadedFiles.projectId, projectId),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete media:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 },
    );
  }
}
