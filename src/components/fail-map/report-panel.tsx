'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import {
  ArrowDownToLine,
  ArrowLeft,
  Check,
  ExternalLink,
  Link2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
} from '@/components/ui/dialog';
import { SourceFavicon } from './source-favicon';
import {
  prepareReport,
  reportMarkdown,
  sourceHostname,
  sourceTitle,
} from './report-utils';
import {
  formatCoordinates,
  type FailExample,
  type Source,
} from './types';
import './report.css';

interface ReportPanelProps {
  example: FailExample | null;
  onClose: () => void;
  onArchiveSearch?: () => void;
}

interface ProjectImage {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageUrl: string;
  uploadedAt: string;
}

function SourceRow({ source, index }: { source: Source; index: number }) {
  return (
    <a
      className="dossier-source"
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="dossier-source-index">
        {String(index + 1).padStart(2, '0')}
      </span>
      <SourceFavicon url={source.url} size={20} />
      <span className="dossier-source-copy">
        <strong>{sourceTitle(source)}</strong>
        <span>{sourceHostname(source.url)}</span>
      </span>
      <ExternalLink size={14} aria-hidden="true" />
    </a>
  );
}

export function ReportPanel({
  example,
  onClose,
  onArchiveSearch,
}: ReportPanelProps) {
  const [markdown, setMarkdown] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load project images if this is a database project (has an id field)
  useEffect(() => {
    if (!example || !('id' in example && typeof example.id === 'string' && example.id.includes('-'))) {
      setImages([]);
      return;
    }

    const controller = new AbortController();
    fetch(`/api/projects/${example.id}/media`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : [])
      .then(setImages)
      .catch(() => setImages([]));

    return () => controller.abort();
  }, [example]);

  useEffect(() => {
    setMarkdown('');
    setLoadError('');
    setLoading(false);
    scrollRef.current?.scrollTo({ top: 0 });
    if (!example) return;

    // Check if this is a database project (has UUID-style ID)
    const isDatabaseProject = example.id.includes('-');
    
    if (isDatabaseProject) {
      // For database projects, fetch the full project data to get reportContent
      setLoading(true);
      const controller = new AbortController();
      fetch(`/api/projects?search=${encodeURIComponent(example.id)}`, { signal: controller.signal })
        .then((response) => response.ok ? response.json() : { projects: [] })
        .then((data) => {
          const project = data.projects?.[0];
          if (project?.reportContent) {
            setMarkdown(project.reportContent);
          } else {
            // Generate basic content from project data
            setMarkdown(`## Project Details\n\n${example.summary || 'No description available.'}`);
          }
        })
        .catch((error: Error) => {
          if (error.name !== 'AbortError') {
            setLoadError('Failed to load project details');
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
      return () => controller.abort();
    } else {
      // For static examples, load from file as before
      const controller = new AbortController();
      setLoading(true);
      fetch(example.reportPath, { signal: controller.signal })
        .then((response) => {
          if (!response.ok)
            throw new Error(
              'The report could not be loaded. Please try opening it again.',
            );
          return response.text();
        })
        .then(setMarkdown)
        .catch((error: Error) => {
          if (error.name !== 'AbortError') setLoadError(error.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
      return () => controller.abort();
    }
  }, [example]);

  if (!example) return null;

  const title = example.title;
  const { body, sources } = prepareReport(markdown, example.sources);
  const location = `${example.location}, ${example.country}`;
  const coordinates = formatCoordinates(example.lat, example.lng);
  const sections = body.split('\n').flatMap((line, index) => {
    const heading = line.match(/^##\s+(.+)$/);
    return heading
      ? [
          {
            id: `report-section-${index + 1}`,
            title: heading[1].replace(/[*_`]/g, ''),
          },
        ]
      : [];
  });
  const readingMinutes = markdown
    ? Math.max(1, Math.ceil(markdown.split(/\s+/).length / 220))
    : 0;

  async function share() {
    if (!example) return;
    setShareState('idle');
    const url = `${window.location.origin}/?case=${encodeURIComponent(example.id)}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        setShareState('copied');
      }
    } catch {
      // Silent fail - user can manually copy from URL bar
    }
  }

  function download() {
    if (!example) return;
    const blob = new Blob([reportMarkdown(title, body, sources)], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${example.id}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="dossier-dialog" showCloseButton={false} aria-describedby="project-details-description">
        <span id="project-details-description" className="sr-only">
          Detailed report for {title} including location, status, timeline, and full documentation.
        </span>
        <header className="dossier-toolbar">
          <DialogClose className="dossier-back">
            <ArrowLeft size={17} />
            <span>Back to atlas</span>
          </DialogClose>
          <span className="dossier-toolbar-title">{title}</span>
          <div className="dossier-toolbar-actions">
            <button
              className="dossier-tool"
              onClick={share}
              aria-label={shareState === 'copied' ? 'Link copied' : 'Share report'}
            >
              {shareState === 'copied' ? <Check size={17} /> : <Link2 size={17} />}
              <span>{shareState === 'copied' ? 'Copied' : 'Share'}</span>
            </button>
            <button
              className="dossier-tool"
              onClick={download}
              aria-label="Download report"
            >
              <ArrowDownToLine size={17} />
              <span>Download</span>
            </button>
          </div>
        </header>

        <div className="dossier-content" ref={scrollRef}>
          {/* Hero Section */}
          <div className="dossier-hero">
            <div className="dossier-hero-content">
              <h1 className="dossier-hero-title">{title}</h1>
              {example.subtitle && (
                <p className="dossier-hero-subtitle">{example.subtitle}</p>
              )}
              
              {/* Status Badge */}
              <div className="dossier-hero-meta">
                <span className="dossier-status-badge" data-status={example.status.toLowerCase().replace(/\s+/g, '-')}>
                  {example.status}
                </span>
                <span className="dossier-hero-period">{example.period}</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="dossier-grid">
            {/* Sidebar */}
            <aside className="dossier-sidebar">
              {/* Location Card */}
              <div className="dossier-card">
                <div className="dossier-card-header">
                  <svg className="dossier-card-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <strong>Location</strong>
                </div>
                <div className="dossier-card-content">
                  <p className="dossier-card-primary">{location}</p>
                  {coordinates && (
                    <p className="dossier-card-secondary">{coordinates}</p>
                  )}
                </div>
              </div>

              {/* Category Card */}
              <div className="dossier-card">
                <div className="dossier-card-header">
                  <svg className="dossier-card-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
                  </svg>
                  <strong>Category</strong>
                </div>
                <div className="dossier-card-content">
                  <p className="dossier-card-primary capitalize">{example.category}</p>
                </div>
              </div>

              {/* Reading Time Card */}
              {readingMinutes > 0 && (
                <div className="dossier-card">
                  <div className="dossier-card-header">
                    <svg className="dossier-card-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <strong>Reading Time</strong>
                  </div>
                  <div className="dossier-card-content">
                    <p className="dossier-card-primary">
                      {readingMinutes} {readingMinutes === 1 ? 'minute' : 'minutes'}
                    </p>
                  </div>
                </div>
              )}

              {/* Table of Contents */}
              {sections.length > 0 && (
                <div className="dossier-card">
                  <div className="dossier-card-header">
                    <svg className="dossier-card-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    <strong>Contents</strong>
                  </div>
                  <nav className="dossier-card-content dossier-toc-nav">
                    {sections.map((section) => (
                      <a key={section.id} href={`#${section.id}`} className="dossier-toc-link">
                        {section.title}
                      </a>
                    ))}
                  </nav>
                </div>
              )}
            </aside>

            {/* Main Article */}
            <article className="dossier-article">
              {loading && <p className="dossier-loading">Loading report...</p>}
              {loadError && <p className="dossier-error">{loadError}</p>}
              {!loading && !loadError && markdown && (
                <>
                  {/* Summary Card */}
                  {example.summary && (
                    <div className="dossier-summary-card">
                      <h3 className="dossier-summary-title">Overview</h3>
                      <p className="dossier-summary-text">{example.summary}</p>
                    </div>
                  )}

                  {/* Main Content */}
                  <div className="dossier-prose">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h2: ({ node, ...props }) => {
                          const text = String(props.children);
                          const match = body.match(new RegExp(`^##\\s+${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));
                          if (match) {
                            const index = body.substring(0, match.index).split('\n').filter(l => l.match(/^##\s+/)).length;
                            return <h2 id={`report-section-${index + 1}`} {...props} />;
                          }
                          return <h2 {...props} />;
                        },
                      }}
                    >
                      {body}
                    </ReactMarkdown>
                  </div>

                  {/* Lesson Callout */}
                  {example.lesson && (
                    <div className="dossier-lesson-card">
                      <div className="dossier-lesson-icon">💡</div>
                      <div>
                        <h3 className="dossier-lesson-label">Key Lesson</h3>
                        <p className="dossier-lesson-text">{example.lesson}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Image Gallery */}
              {images.length > 0 && (
                <section className="dossier-images-section">
                  <h2 className="dossier-section-title">Project Images</h2>
                  <div className="dossier-image-grid">
                    {images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImageIndex(index)}
                        className="dossier-image-card"
                        aria-label={`View image ${index + 1}: ${image.fileName}`}
                      >
                        <Image
                          src={image.storageUrl}
                          alt={image.fileName}
                          fill
                          className="dossier-image"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                        <div className="dossier-image-overlay" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Sources Section */}
              {sources.length > 0 && (
                <section className="dossier-sources-section">
                  <h2 className="dossier-section-title">Sources & References</h2>
                  <div className="dossier-source-list">
                    {sources.map((source, index) => (
                      <SourceRow key={source.url} source={source} index={index} />
                    ))}
                  </div>
                  {onArchiveSearch && (
                    <button
                      className="dossier-archive-button"
                      onClick={onArchiveSearch}
                    >
                      Search archivi.ng for contemporary press
                    </button>
                  )}
                </section>
              )}
            </article>
          </div>
        </div>

        {/* Image Lightbox */}
        {selectedImageIndex !== null && images[selectedImageIndex] && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
            onClick={() => setSelectedImageIndex(null)}
          >
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            {selectedImageIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(selectedImageIndex - 1);
                }}
                className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {selectedImageIndex < images.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(selectedImageIndex + 1);
                }}
                className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center px-16">
              <Image
                src={images[selectedImageIndex].storageUrl}
                alt={images[selectedImageIndex].fileName}
                fill
                className="object-contain"
                sizes="90vw"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="absolute bottom-4 left-4 right-4 text-center z-10">
              <div className="inline-block bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
                <p className="text-white font-medium">{images[selectedImageIndex].fileName}</p>
                <p className="text-sm text-gray-300">
                  Image {selectedImageIndex + 1} of {images.length}
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
