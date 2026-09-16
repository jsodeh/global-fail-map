'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminSession } from '@/lib/stores/use-admin-session';
import { CheckCircle, XCircle, ExternalLink, Eye } from 'lucide-react';

interface Submission {
  id: string;
  submissionType: string;
  submitterName: string | null;
  submitterContact: string | null;
  claimText: string;
  sourceUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  submittedAt: string;
}

export default function SubmissionsPage() {
  const router = useRouter();
  const { session, isLoading: sessionLoading, fetchSession } = useAdminSession();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]); // Store all for counts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [projectData, setProjectData] = useState({
    title: '',
    subtitle: '',
    tier: 'federal' as 'federal' | 'state' | 'lga',
    mda: '',
    state: '',
    sector: '',
    status: 'planned' as any,
  });

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (!sessionLoading && !session.isLoggedIn) {
      router.push('/admin/login');
    }
  }, [sessionLoading, session.isLoggedIn, router]);

  useEffect(() => {
    if (session.isLoggedIn) {
      loadSubmissions();
    }
  }, [session, statusFilter]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      
      // Load all submissions for counts
      const allResponse = await fetch('/api/admin/submissions?status=all');
      if (!allResponse.ok) throw new Error('Failed to load submissions');
      const allData = await allResponse.json();
      setAllSubmissions(allData);
      
      // Load filtered submissions for display
      const response = await fetch(
        `/api/admin/submissions?status=${statusFilter}`,
      );
      if (!response.ok) throw new Error('Failed to load submissions');
      const data = await response.json();
      setSubmissions(data);
      setError('');
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  // Calculate counts from all submissions
  const statusCounts = {
    pending: allSubmissions.filter((s) => s.status === 'pending').length,
    approved: allSubmissions.filter((s) => s.status === 'approved').length,
    rejected: allSubmissions.filter((s) => s.status === 'rejected').length,
    all: allSubmissions.length,
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    try {
      const response = await fetch(
        `/api/admin/submissions/${selectedSubmission.id}/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectData }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve submission');
      }

      const result = await response.json();
      
      // Reset form
      setShowApproveForm(false);
      setSelectedSubmission(null);
      setProjectData({
        title: '',
        subtitle: '',
        tier: 'federal',
        mda: '',
        state: '',
        sector: '',
        status: 'planned',
      });

      // Reload submissions
      await loadSubmissions();

      // Show success message
      alert(`Submission approved! Project created with ID: ${result.projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve submission');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    try {
      const response = await fetch(
        `/api/admin/submissions/${selectedSubmission.id}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: rejectReason }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject submission');
      }

      // Reset form
      setShowRejectForm(false);
      setSelectedSubmission(null);
      setRejectReason('');

      // Reload submissions
      await loadSubmissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject submission');
    }
  };

  const startApprove = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowApproveForm(true);
    setShowRejectForm(false);
    
    // Pre-fill project data with submission info
    setProjectData({
      title: submission.claimText.substring(0, 200), // Use first part as title
      subtitle: '',
      tier: 'federal',
      mda: '',
      state: '',
      sector: '',
      status: 'planned',
    });
  };

  const startReject = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowRejectForm(true);
    setShowApproveForm(false);
    setRejectReason('');
  };

  const cancelAction = () => {
    setSelectedSubmission(null);
    setShowApproveForm(false);
    setShowRejectForm(false);
    setRejectReason('');
    setError('');
  };

  if (sessionLoading || loading) {
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
              <Link href="/admin" className="text-xl font-bold text-gray-900">
                Progress Map Admin
              </Link>
              <span className="ml-4 text-gray-400">→</span>
              <span className="ml-4 text-gray-600">Submissions Queue</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Public Submissions
              </h1>
              <p className="text-gray-600 mt-1">
                Review and approve project suggestions from the public
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  statusFilter === 'pending'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Pending ({statusCounts.pending})
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  statusFilter === 'approved'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Approved ({statusCounts.approved})
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  statusFilter === 'rejected'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Rejected ({statusCounts.rejected})
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  statusFilter === 'all'
                    ? 'border-gray-600 text-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                All ({statusCounts.all})
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Approve Form */}
          {showApproveForm && selectedSubmission && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Approve Submission & Create Project
              </h2>
              
              <div className="bg-gray-50 p-4 rounded mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Submitted Content:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedSubmission.claimText}</p>
                {selectedSubmission.sourceUrl && (
                  <a
                    href={selectedSubmission.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center mt-2"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Source URL
                  </a>
                )}
              </div>

              <form onSubmit={handleApprove} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={projectData.title}
                      onChange={(e) =>
                        setProjectData({ ...projectData, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tier *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={projectData.tier}
                      onChange={(e) =>
                        setProjectData({
                          ...projectData,
                          tier: e.target.value as 'federal' | 'state' | 'lga',
                        })
                      }
                    >
                      <option value="federal">Federal</option>
                      <option value="state">State</option>
                      <option value="lga">LGA</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MDA *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={projectData.mda}
                      onChange={(e) =>
                        setProjectData({ ...projectData, mda: e.target.value })
                      }
                      placeholder="e.g., Federal Ministry of Works"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={projectData.state}
                      onChange={(e) =>
                        setProjectData({ ...projectData, state: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sector
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={projectData.sector}
                      onChange={(e) =>
                        setProjectData({ ...projectData, sector: e.target.value })
                      }
                      placeholder="e.g., Roads, Power, Health"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={cancelAction}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Approve & Create Project
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reject Form */}
          {showRejectForm && selectedSubmission && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Reject Submission
              </h2>
              <form onSubmit={handleReject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Reason (optional)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g., Insufficient information, duplicate submission"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={cancelAction}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Reject Submission
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Submissions List */}
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                No {statusFilter !== 'all' ? statusFilter : ''} submissions found
              </div>
            ) : (
              submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-white rounded-lg shadow p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            submission.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : submission.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {submission.status.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(submission.submittedAt).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-gray-900 whitespace-pre-wrap mb-3">
                        {submission.claimText}
                      </p>

                      {submission.submitterName && (
                        <p className="text-sm text-gray-600">
                          <strong>Submitted by:</strong> {submission.submitterName}
                          {submission.submitterContact && ` (${submission.submitterContact})`}
                        </p>
                      )}

                      {submission.sourceUrl && (
                        <a
                          href={submission.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center mt-2"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Source
                        </a>
                      )}

                      {submission.status !== 'pending' && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            <strong>Reviewed by:</strong> {submission.reviewedByName || 'Unknown'} on{' '}
                            {submission.reviewedAt
                              ? new Date(submission.reviewedAt).toLocaleString()
                              : 'N/A'}
                          </p>
                          {submission.rejectionReason && (
                            <p className="text-sm text-red-600 mt-1">
                              <strong>Reason:</strong> {submission.rejectionReason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {submission.status === 'pending' && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => startApprove(submission)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => startReject(submission)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
