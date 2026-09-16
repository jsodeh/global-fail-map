'use client';

import { useState, useEffect } from 'react';
import { ProjectBudget } from '@/lib/db/schema';

interface ProjectBudgetsProps {
  projectId: string;
}

export function ProjectBudgets({ projectId }: ProjectBudgetsProps) {
  const [budgets, setBudgets] = useState<ProjectBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    appropriated: '',
    released: '',
    spent: '',
    sourceUrl: '',
    sourceTitle: '',
    fiscalYear: '',
    budgetLine: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadBudgets();
  }, [projectId]);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/budgets`);
      const data = await response.json();
      
      if (response.ok) {
        setBudgets(data.budgets);
      }
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      appropriated: '',
      released: '',
      spent: '',
      sourceUrl: '',
      sourceTitle: '',
      fiscalYear: '',
      budgetLine: '',
    });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (budget: ProjectBudget) => {
    setFormData({
      appropriated: budget.appropriated || '',
      released: budget.released || '',
      spent: budget.spent || '',
      sourceUrl: budget.sourceUrl,
      sourceTitle: budget.sourceTitle || '',
      fiscalYear: budget.fiscalYear?.toString() || '',
      budgetLine: budget.budgetLine || '',
    });
    setEditingId(budget.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.sourceUrl) {
      setError('Source URL is required');
      return;
    }

    try {
      const payload = {
        appropriated: formData.appropriated ? parseFloat(formData.appropriated) : null,
        released: formData.released ? parseFloat(formData.released) : null,
        spent: formData.spent ? parseFloat(formData.spent) : null,
        sourceUrl: formData.sourceUrl,
        sourceTitle: formData.sourceTitle || null,
        fiscalYear: formData.fiscalYear ? parseInt(formData.fiscalYear) : null,
        budgetLine: formData.budgetLine || null,
      };

      const url = editingId
        ? `/api/admin/projects/${projectId}/budgets/${editingId}`
        : `/api/admin/projects/${projectId}/budgets`;
      
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        loadBudgets();
        resetForm();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save budget');
      }
    } catch (err) {
      setError('Failed to save budget');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/projects/${projectId}/budgets/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadBudgets();
      } else {
        alert('Failed to delete budget');
      }
    } catch (err) {
      alert('Failed to delete budget');
    }
  };

  const formatMoney = (value: string | null) => {
    if (!value) return '—';
    const num = parseFloat(value);
    return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Budget History</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Add Budget Entry
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-gray-900">
            {editingId ? 'Edit Budget Entry' : 'New Budget Entry'}
          </h4>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appropriated (₦)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={formData.appropriated}
                onChange={(e) => setFormData(prev => ({ ...prev, appropriated: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Released (₦)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={formData.released}
                onChange={(e) => setFormData(prev => ({ ...prev, released: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spent (₦)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={formData.spent}
                onChange={(e) => setFormData(prev => ({ ...prev, spent: e.target.value }))}
                placeholder="0.00"
              />
            </div>
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
                placeholder="e.g., 2023 Federal Budget"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fiscal Year
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={formData.fiscalYear}
                onChange={(e) => setFormData(prev => ({ ...prev, fiscalYear: e.target.value }))}
                placeholder="e.g., 2023"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget Line
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={formData.budgetLine}
                onChange={(e) => setFormData(prev => ({ ...prev, budgetLine: e.target.value }))}
                placeholder="e.g., MDA Code 12345"
              />
            </div>
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
              {editingId ? 'Save Changes' : 'Add Budget'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No budget entries yet. Add one to track financial data.
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => (
            <div key={budget.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  {budget.fiscalYear && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded mb-2">
                      FY {budget.fiscalYear}
                    </span>
                  )}
                  {budget.budgetLine && (
                    <p className="text-sm text-gray-600">{budget.budgetLine}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(budget)}
                    className="text-sm text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="text-sm text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Appropriated</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatMoney(budget.appropriated)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Released</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatMoney(budget.released)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Spent</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatMoney(budget.spent)}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-2">
                <p className="text-xs text-gray-500 mb-1">Source</p>
                <a
                  href={budget.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-900 break-all"
                >
                  {budget.sourceTitle || budget.sourceUrl}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
