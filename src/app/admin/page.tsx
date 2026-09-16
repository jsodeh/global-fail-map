'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminSession } from '@/lib/stores/use-admin-session';

interface Stats {
  projects: {
    total: number;
    byStatus: Record<string, number>;
    byTier: Record<string, number>;
    topStates: Array<{ state: string; count: number }>;
  };
  submissions: {
    total: number;
    byStatus: Record<string, number>;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { session, isLoading, fetchSession, logout } = useAdminSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (!isLoading && !session.isLoggedIn) {
      router.push('/admin/login');
    } else if (session.isLoggedIn) {
      loadStats();
    }
  }, [isLoading, session.isLoggedIn, router]);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

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
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome, {session.name}!
            </h2>
            <p className="text-gray-600">
              You are logged in as <strong>{session.role}</strong>.
            </p>
          </div>

          {/* Statistics Cards */}
          {loadingStats ? (
            <div className="text-center py-8 text-gray-600">Loading statistics...</div>
          ) : stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Projects Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects</h3>
                <div className="text-3xl font-bold text-blue-600 mb-4">{stats.projects.total}</div>
                <div className="space-y-2 text-sm">
                  {Object.entries(stats.projects.byStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between">
                      <span className="text-gray-600 capitalize">{status}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submissions Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Submissions</h3>
                <div className="text-3xl font-bold text-green-600 mb-4">{stats.submissions.total}</div>
                <div className="space-y-2 text-sm">
                  {Object.entries(stats.submissions.byStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between">
                      <span className="text-gray-600 capitalize">{status}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tier Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">By Tier</h3>
                <div className="space-y-3">
                  {Object.entries(stats.projects.byTier).map(([tier, count]) => (
                    <div key={tier}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 capitalize">{tier}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(count / stats.projects.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Top States */}
          {stats && stats.projects.topStates.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top States by Project Count</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {stats.projects.topStates.map((item) => (
                  <div key={item.state} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{item.count}</div>
                    <div className="text-sm text-gray-600">{item.state}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Links
            </h3>
            <div className="space-y-3">
              <Link
                href="/admin/projects"
                className="block px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <div className="font-medium text-blue-900">Manage Projects</div>
                <div className="text-sm text-blue-700">Create, edit, and view all projects</div>
              </Link>
              
              <Link
                href="/admin/submissions"
                className="block px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <div className="font-medium text-green-900">Review Submissions</div>
                <div className="text-sm text-green-700">Review and approve public project suggestions</div>
              </Link>
              
              {session.role === 'super_admin' && (
                <Link
                  href="/admin/admins"
                  className="block px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-purple-900">Admin Management</div>
                  <div className="text-sm text-purple-700">Create and manage admin accounts (Super Admin only)</div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
