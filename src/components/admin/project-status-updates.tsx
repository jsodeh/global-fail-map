'use client';

import { useState, useEffect } from 'react';
import { StatusUpdate } from '@/lib/db/schema';

interface ProjectStatusUpdatesProps {
  projectId: string;
  currentStatus: string;
  onStatusChange?: () => void;
}

export function ProjectStatusUpdates({ 
  projectId, 
  currentStatus,
  onStatusChange 
}: ProjectStatusUpdatesProps) {
  const [updates, setUpdates] = useState<StatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    status: currentStatus,
    date: new Date().toISOString().split('T')[0],
    note: '',
    sourceUrl: '',
    sourceTitle: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadUpdates();
  }, [projectId]);

  const loadUpdates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/status-updates`);
      const data = await response.json();
      
      if (response.ok) {
        setUpdates(data.statusUpdates);
      }
    } catch (err) {
      console.error('Failed to load status updates:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      status: currentStatus,
      date: new Date().toISOString().split('T')[0],
      note: '',
      sourceUrl: '',
      sourceTitle: '',
    });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (update: StatusUpdate) => {
    setFormData({
      status: update.status,
      date: update.date,
      note: update.note,
      sourceUrl: update.sourceUrl,
      sourceTitle: update.sourceTitle || '',
    });
    setEditingId(update.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.status || !formData.date || !formData.note || !formData.sourceUrl) {
      setError('All fields except source title are required');
      return;
    }

    try {
      const url = editingId
        ? `/api/admin/projects/${projectId}/status-updates/${editingId}`
        : `/api/admin/projects/${projectId}/status-updates`;
      
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        loadUpdates();
        resetForm();
        // Notify parent that status changed (to refresh project details)
        if (!editingId && onStatusChange) {
          onStatusChange();
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save status update');
      }
    } catch (err) {
      setError('Failed to save status update');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this status update?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/projects/${projectId}/status-updates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadUpdates();
      } else {
        alert('Failed to delete status update');
      }
    } catch (err) {
      alert('Failed to delete status update');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'stalled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'abandoned':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Status History</h3>
          <p className="text-sm text-gray-500 mt-1">
            Current status: <span className="font-semibold capitalize">{currentStatus}</span>
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Record Status Change
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-gray-900">
            {editingId ? 'Edit Status Update' : 'New Status Update'}
          </h4>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="planned">Planned</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="stalled">Stalled</option>
                <option value="abandoned">Abandoned</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What happened? *
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="e.g., Contractor abandoned site, Phase 1 completed and commissioned"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source URL *
              </label>
              <input
                type="url"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={formData.sourceUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, sourceUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Title
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={formData.sourceTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, sourceTitle: e.target.value }))}
                placeholder="e.g., News article, Government report"
              />
            </div>
          </div>

          {!editingId && (
            <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded text-sm text-blue-800">
              💡 Adding this status update will automatically update the project's current status.
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              {editingId ? 'Save Changes' : 'Record Status Change'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading status history...</div>
      ) : updates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No status updates yet. Record one to track project progress.
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map((update, index) => (
            <div key={update.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(update.status)}`}>
                    {update.status}
                  </span>
                  <span className="text-sm text-gray-600">
                    {formatDate(update.date)}
                  </span>
                  {index === 0 && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                      CURRENT
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(update)}
                    className="text-sm text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(update.id)}
                    className="text-sm text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="text-gray-900 mb-3">{update.note}</p>

              <div className="border-t border-gray-200 pt-2">
                <p className="text-xs text-gray-500 mb-1">Source</p>
                <a
                  href={update.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-900 break-all"
                >
                  {update.sourceTitle || update.sourceUrl}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
