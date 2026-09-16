/**
 * Server-side session utilities
 * Use these in API routes and Server Components
 */

import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getSessionOptions, SessionData, defaultSession } from './session';

/**
 * Get the current session (server-side)
 */
export async function getSession(): Promise<SessionData> {
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions(),
  );

  if (!session.isLoggedIn || !session.adminId) {
    return defaultSession;
  }

  return {
    adminId: session.adminId,
    email: session.email!,
    name: session.name!,
    role: session.role!,
    isLoggedIn: true,
  };
}

/**
 * Require authentication - throws if not logged in
 * Use in API routes that need authentication
 */
export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();

  if (!session.isLoggedIn) {
    throw new Error('Unauthorized');
  }

  return session;
}

/**
 * Require super admin role
 */
export async function requireSuperAdmin(): Promise<SessionData> {
  const session = await requireAuth();

  if (session.role !== 'super_admin') {
    throw new Error('Forbidden: Super admin access required');
  }

  return session;
}
