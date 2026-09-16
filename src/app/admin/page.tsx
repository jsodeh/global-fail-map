'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminSession } from '@/lib/stores/use-admin-session';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { session, isLoading, fetchSession, logout } = useAdminSession();

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (!isLoading && !session.isLoggedIn) {
      router.push('/admin/login');
    }
  }, [isLoading, session.isLoggedIn, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!session.isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Progress Map Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {session.name} ({session.role})
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome, {session.name}!
            </h2>
            <p className="text-gray-600 mb-6">
              You are logged in as <strong>{session.role}</strong>.
            </p>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Links:
              </h3>
              <div className="space-y-3">
                <a
                  href="/admin/projects"
                  className="block px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-blue-900">Manage Projects</div>
                  <div className="text-sm text-blue-700">Create, edit, and view all projects</div>
                </a>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Coming in Phase 5b-5g:
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Manage budgets and status updates</li>
                <li>• Upload source documents (PDFs, Excel)</li>
                <li>• Review public submissions</li>
                <li>• Create additional admin accounts (super admin only)</li>
                <li>• View project statistics and analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
