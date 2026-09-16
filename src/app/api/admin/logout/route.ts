/**
 * POST /api/admin/logout - Admin logout
 */

import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { getSessionOptions, SessionData } from '@/lib/auth/session';

export async function POST() {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      getSessionOptions(),
    );

    session.destroy();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 },
    );
  }
}
