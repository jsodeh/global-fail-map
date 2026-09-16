/**
 * Client-side admin session store
 */

import { create } from 'zustand';
import { SessionData, defaultSession } from '../auth/session';

interface AdminSessionStore {
  session: SessionData;
  isLoading: boolean;
  fetchSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAdminSession = create<AdminSessionStore>((set) => ({
  session: defaultSession,
  isLoading: true,

  fetchSession: async () => {
    try {
      const response = await fetch('/api/admin/session');
      const data = await response.json();
      set({ session: data.session, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch session:', error);
      set({ session: defaultSession, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    set({
      session: {
        adminId: data.admin.id,
        email: data.admin.email,
        name: data.admin.name,
        role: data.admin.role,
        isLoggedIn: true,
      },
    });
  },

  logout: async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    set({ session: defaultSession });
  },
}));
