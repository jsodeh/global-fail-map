'use client';

import { useState, useEffect } from 'react';
import { ProjectSource } from '@/lib/db/schema';
import { ExternalLink } from 'lucide-react';

interface ProjectSourcesProps {
  projectId: string;
}

export function ProjectSources({ projectId }: ProjectSourcesProps) {
  const [sources, setSources] = useState<ProjectSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    url: '',
    title: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadSources();
  }, [projectId]);

  const loadSources = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/sources`);
      const data = await response.json();
      
      if (response.ok) {
        setSources(data.sources);
      }
    } catch (err) {
      console.error('Failed to load sources:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      url: '',
      title: '',
    });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (source: ProjectSource) => {
    setFormData({
      url: source.url,
      title: source.title,
    });
    setEditingId(source.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.url || !formData.title) {
      setError('URL and title are required');
      return;
    }

    try {
      const url = editingId
        ? `/api/admin/projects/${projectId}/sources/${editingId}`
        : `/api/admin/projects/${projectId}/sources`;
      
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        loadSources();
        resetForm();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save source');
      }
    } catch (err) {
      setError('Failed to save source');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/projects/${projectId}/sources/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadSources();
      } else {
        alert('Failed to delete source');
      }
    } catch (err) {
      alert('Failed to delete source');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Sources</h3>
          <p className="text-sm text-gray-500 mt-1">
            Reference materials and evidence for this project
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Add Source
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-gray-900">
            {editingId ? 'Edit Source' : 'New Source'}
          </h4>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., 2023 Budget Document, News Article, Government Report"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL *
            </label>
            <input
              type="url"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://..."
            />
          </div>

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
              {editingId ? 'Save Changes' : 'Add Source'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading sources...</div>
      ) : sources.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No sources yet. Add reference materials to document this project.
        </div>
      ) : (
        <div className="space-y-2">
          {sources.map((source) => (
            <div 
              key={source.id} 
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 mr-4">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {source.title}
                  </h4>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-900 break-all flex items-center gap-1"
                  >
                    {source.url}
                    <ExternalLink size={14} className="flex-shrink-0" />
                  </a>
                </div>
                <div className="flex space-x-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(source)}
                    className="text-sm text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(source.id, source.title)}
                    className="text-sm text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sources.length > 0 && (
        <div className="text-sm text-gray-500 pt-2">
          {sources.length} {sources.length === 1 ? 'source' : 'sources'} total
        </div>
      )}
    </div>
  );
}
