'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Trash2, Download, X } from 'lucide-react';

interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageUrl: string;
  uploadedBy: string | null;
  uploadedAt: string;
}

interface ProjectFilesProps {
  projectId: string;
}

export function ProjectFiles({ projectId }: ProjectFilesProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/projects/${projectId}/files`);
      if (!response.ok) throw new Error('Failed to load files');
      const data = await response.json();
      setFiles(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load files:', err);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const file = selectedFiles[0];
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/admin/projects/${projectId}/files`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
      }

      await loadFiles();

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Failed to upload file:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(
        `/api/admin/projects/${projectId}/files/${fileId}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) throw new Error('Failed to delete file');

      await loadFiles();
    } catch (err) {
      console.error('Failed to delete file:', err);
      setError('Failed to delete file');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('spreadsheet') || fileType.includes('excel'))
      return '📊';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('image')) return '🖼️';
    return '📎';
  };

  if (loading) {
    return <div className="text-gray-600">Loading files...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div
          className={`space-y-4 ${dragActive ? 'opacity-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex items-center justify-center">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>

          <div className="text-center">
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
            >
              Click to upload
            </label>
            <span className="text-gray-600"> or drag and drop</span>
            <p className="text-sm text-gray-500 mt-1">
              PDF, Excel, Word, or images (max 10MB)
            </p>
          </div>

          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            className="hidden"
            accept=".pdf,.xlsx,.xls,.docx,.doc,.jpg,.jpeg,.png,.webp"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={uploading}
          />

          {uploading && (
            <div className="text-center text-sm text-blue-600">
              Uploading...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start justify-between">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Files List */}
      {files.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No files uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Uploaded Files</h3>
          {files.map((file) => (
            <div
              key={file.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-2xl">{getFileIcon(file.fileType)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900 truncate">
                        {file.fileName}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {formatFileSize(file.fileSize)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Uploaded {file.uploadedBy ? `by ${file.uploadedBy} ` : ''}on{' '}
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <a
                    href={file.storageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => deleteFile(file.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
