'use client';

import { useState } from 'react';
import { X, Send, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

interface SubmissionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubmissionForm({ open, onOpenChange }: SubmissionFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    claimText: '',
    submitterName: '',
    submitterContact: '',
    sourceUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimText: formData.claimText.trim(),
          submitterName: formData.submitterName.trim() || undefined,
          submitterContact: formData.submitterContact.trim() || undefined,
          sourceUrl: formData.sourceUrl.trim() || undefined,
          submissionType: 'new_project',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit');
      }

      // Show success state
      setSuccess(true);

      // Reset form after 3 seconds and close
      setTimeout(() => {
        setFormData({
          claimText: '',
          submitterName: '',
          submitterContact: '',
          sourceUrl: '',
        });
        setSuccess(false);
        onOpenChange(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        claimText: '',
        submitterName: '',
        submitterContact: '',
        sourceUrl: '',
      });
      setError('');
      setSuccess(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle>Suggest a Project to Track</DialogTitle>
        <DialogDescription>
          Know about a Nigerian government project we should track? Share the details below.
        </DialogDescription>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Thank you for your submission!
            </h3>
            <p className="text-gray-600">
              Your suggestion will be reviewed by our team shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Description *
              </label>
              <textarea
                required
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the project, its status, location, and any relevant details..."
                value={formData.claimText}
                onChange={(e) =>
                  setFormData({ ...formData, claimText: e.target.value })
                }
                maxLength={5000}
              />
              <div className="text-sm text-gray-500 mt-1 text-right">
                {formData.claimText.length} / 5000 characters
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                  value={formData.submitterName}
                  onChange={(e) =>
                    setFormData({ ...formData, submitterName: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact (optional)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email or phone"
                  value={formData.submitterContact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      submitterContact: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source URL (optional)
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/article"
                value={formData.sourceUrl}
                onChange={(e) =>
                  setFormData({ ...formData, sourceUrl: e.target.value })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Link to news article, government website, or other source
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Submissions are reviewed by our team before being added to the map.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.claimText.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : 'Submit'}</span>
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
