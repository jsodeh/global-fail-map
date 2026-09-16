'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminSession } from '@/lib/stores/use-admin-session';
import { Project } from '@/lib/db/schema';
import { ProjectBudgets } from '@/components/admin/project-budgets';
import { ProjectStatusUpdates } from '@/components/admin/project-status-updates';
import { ProjectSources } from '@/components/admin/project-sources';

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { session, isLoading: sessionLoading, fetchSession } = useAdminSession();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'budgets' | 'status' | 'sources'>('details');
  const [formData, setFormData] = useState<Partial<Project>>({
    title: '',
    subtitle: '',
    reportContent: '',
    tier: 'federal',
    mda: '',
    state: '',
    lga: '',
    sector: '',
    status: 'planned',
    lat: '',
    lng: '',
    locationName: '',
    locationRole: '',
    contractorName: '',
    contractorRegInfo: '',
    fundingSource: '',
    startDate: null,
    expectedCompletion: null,
    revisedCompletion: null,
    confidence: 'moderate',
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
    if (session.isLoggedIn && resolvedParams.id !== 'new') {
      loadProject();
    }
  }, [session.isLoggedIn, resolvedParams.id]);

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/admin/projects/${resolvedParams.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setFormData(data.project);
      } else {
        setError('Project not found');
      }
    } catch (err) {
      setError('Failed to load project');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = resolvedParams.id === 'new' 
        ? '/api/admin/projects'
        : `/api/admin/projects/${resolvedParams.id}`;
      
      const method = resolvedParams.id === 'new' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/projects');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save project');
      }
    } catch (err) {
      setError('Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (sessionLoading || !session.isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="text-xl font-bold text-gray-900">
                Progress Map Admin
              </Link>
              <Link href="/admin/projects" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Projects
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {resolvedParams.id === 'new' ? 'Create Project' : 'Edit Project'}
            </h1>
            <Link
              href="/admin/projects"
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Projects
            </Link>
          </div>

          {resolvedParams.id !== 'new' && (
            <div className="flex space-x-4 border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Project Details
              </button>
              <button
                onClick={() => setActiveTab('budgets')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'budgets'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Budgets
              </button>
              <button
                onClick={() => setActiveTab('status')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'status'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Status History
              </button>
              <button
                onClick={() => setActiveTab('sources')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'sources'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Sources
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {activeTab === 'budgets' && resolvedParams.id !== 'new' ? (
            <div className="bg-white rounded-lg shadow p-6">
              <ProjectBudgets projectId={resolvedParams.id} />
            </div>
          ) : activeTab === 'status' && resolvedParams.id !== 'new' ? (
            <div className="bg-white rounded-lg shadow p-6">
              <ProjectStatusUpdates 
                projectId={resolvedParams.id} 
                currentStatus={formData.status || 'planned'}
                onStatusChange={loadProject}
              />
            </div>
          ) : activeTab === 'sources' && resolvedParams.id !== 'new' ? (
            <div className="bg-white rounded-lg shadow p-6">
              <ProjectSources projectId={resolvedParams.id} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.subtitle || ''}
                    onChange={(e) => handleChange('subtitle', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Content (Markdown)
                  </label>
                  <textarea
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                    value={formData.reportContent || ''}
                    onChange={(e) => handleChange('reportContent', e.target.value)}
                    placeholder="# Project Report&#10;&#10;Write your report here in Markdown format..."
                  />
                </div>
              </div>
            </div>

            {/* Government Classification */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Government Classification</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tier *
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.tier}
                    onChange={(e) => handleChange('tier', e.target.value)}
                  >
                    <option value="federal">Federal</option>
                    <option value="state">State</option>
                    <option value="lga">LGA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MDA (Ministry/Department/Agency) *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.mda}
                    onChange={(e) => handleChange('mda', e.target.value)}
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
                    value={formData.state || ''}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="e.g., Lagos, Kano, Rivers"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LGA (Local Government Area)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.lga || ''}
                    onChange={(e) => handleChange('lga', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sector *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.sector}
                    onChange={(e) => handleChange('sector', e.target.value)}
                    placeholder="e.g., roads, power, health, education"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    <option value="planned">Planned</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="stalled">Stalled</option>
                    <option value="abandoned">Abandoned</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.lat}
                    onChange={(e) => handleChange('lat', e.target.value)}
                    placeholder="e.g., 9.0820"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.lng}
                    onChange={(e) => handleChange('lng', e.target.value)}
                    placeholder="e.g., 8.6753"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.locationName}
                    onChange={(e) => handleChange('locationName', e.target.value)}
                    placeholder="e.g., Abuja, Lagos Island"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Role
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.locationRole || ''}
                    onChange={(e) => handleChange('locationRole', e.target.value)}
                    placeholder="e.g., Project site, Headquarters"
                  />
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contractor Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.contractorName || ''}
                    onChange={(e) => handleChange('contractorName', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contractor Registration Info
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.contractorRegInfo || ''}
                    onChange={(e) => handleChange('contractorRegInfo', e.target.value)}
                    placeholder="CAC, TIN, etc."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Funding Source
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.fundingSource || ''}
                    onChange={(e) => handleChange('fundingSource', e.target.value)}
                    placeholder="e.g., 2023 Federal Budget, World Bank Loan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.startDate || ''}
                    onChange={(e) => handleChange('startDate', e.target.value || null)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Completion
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.expectedCompletion || ''}
                    onChange={(e) => handleChange('expectedCompletion', e.target.value || null)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Revised Completion
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.revisedCompletion || ''}
                    onChange={(e) => handleChange('revisedCompletion', e.target.value || null)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Confidence
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.confidence}
                    onChange={(e) => handleChange('confidence', e.target.value)}
                  >
                    <option value="high">High</option>
                    <option value="moderate">Moderate</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/admin/projects"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : resolvedParams.id === 'new' ? 'Create Project' : 'Save Changes'}
              </button>
            </div>
          </form>
          )}
        </div>
      </main>
    </div>
  );
}
