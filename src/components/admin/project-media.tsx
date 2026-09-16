'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, X, Trash2, ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface MediaFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageUrl: string;
  uploadedBy: string | null;
  uploadedAt: string;
  caption?: string;
}

interface ProjectMediaProps {
  projectId: string;
}

export function ProjectMedia({ projectId }: ProjectMediaProps) {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<MediaFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMedia();
  }, [projectId]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/projects/${projectId}/media`);
      if (!response.ok) throw new Error('Failed to load media');
      const data = await response.json();
      setMedia(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load media:', err);
      setError('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    // Allow multiple file upload
    const files = Array.from(selectedFiles);
    await uploadFiles(files);
  };

  const uploadFiles = async (files: File[]) => {
    try {
      setUploading(true);
      setError(null);

      // Upload files sequentially
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/admin/projects/${projectId}/media`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to upload image');
        }
      }

      await loadMedia();

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Failed to upload images:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const deleteMedia = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(
        `/api/admin/projects/${projectId}/media/${mediaId}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) throw new Error('Failed to delete image');

      await loadMedia();
      if (selectedImage?.id === mediaId) {
        setSelectedImage(null);
      }
    } catch (err) {
      console.error('Failed to delete image:', err);
      setError('Failed to delete image');
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

  if (loading) {
    return <div className="text-gray-600">Loading media...</div>;
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
              htmlFor="media-upload"
              className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
            >
              Click to upload
            </label>
            <span className="text-gray-600"> or drag and drop</span>
            <p className="text-sm text-gray-500 mt-1">
              JPG, PNG, or WebP images (max 10MB each, multiple files allowed)
            </p>
          </div>

          <input
            ref={fileInputRef}
            id="media-upload"
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={uploading}
          />

          {uploading && (
            <div className="text-center text-sm text-blue-600">
              Uploading images...
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

      {/* Media Gallery */}
      {media.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No images uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">
              Project Images ({media.length})
            </h3>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((image) => (
              <div
                key={image.id}
                className="relative group border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedImage(image)}
              >
                <div className="aspect-square relative">
                  <Image
                    src={image.storageUrl}
                    alt={image.fileName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMedia(image.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  title="Delete image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* File info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white truncate">{image.fileName}</p>
                  <p className="text-xs text-gray-300">{formatFileSize(image.fileSize)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <Image
              src={selectedImage.storageUrl}
              alt={selectedImage.fileName}
              fill
              className="object-contain"
              sizes="90vw"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-center">
            <div className="inline-block bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
              <p className="text-white font-medium">{selectedImage.fileName}</p>
              <p className="text-sm text-gray-300">
                {formatFileSize(selectedImage.fileSize)} • Uploaded{' '}
                {new Date(selectedImage.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
