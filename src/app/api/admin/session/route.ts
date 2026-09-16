/**
 * GET /api/admin/session - Get current session
 */

import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { getSessionOptions, SessionData, defaultSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      getSessionOptions(),
    );

    if (!session.isLoggedIn) {
      return NextResponse.json({ session: defaultSession });
    }

    return NextResponse.json({
      session: {
        adminId: session.adminId,
        email: session.email,
        name: session.name,
        role: session.role,
        isLoggedIn: session.isLoggedIn,
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ session: defaultSession });
  }
}
