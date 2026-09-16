/**
 * Iron Session configuration for encrypted cookie-based sessions
 */

import { SessionOptions } from 'iron-session';

export interface SessionData {
  adminId: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  adminId: '',
  email: '',
  name: '',
  role: 'admin',
  isLoggedIn: false,
};

function getSessionSecret(): string {
  if (!process.env.SESSION_SECRET) {
    throw new Error(
      'SESSION_SECRET environment variable must be set. Generate one with: openssl rand -base64 32',
    );
  }
  return process.env.SESSION_SECRET;
}

export function getSessionOptions(): SessionOptions {
  return {
    password: getSessionSecret(),
    cookieName: 'progress-map-session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true, // Not accessible via JavaScript
      sameSite: 'lax', // CSRF protection
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  };
}
