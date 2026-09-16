'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowDownToLine,
  ArrowLeft,
  Check,
  ExternalLink,
  Link2,
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMarkdown('');
    setLoadError('');
    setLoading(false);
    scrollRef.current?.scrollTo({ top: 0 });
    if (!example) return;
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
      <DialogContent className="dossier-dialog" showCloseButton={false}>
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
          <aside className="dossier-details">
            <div className="dossier-meta-group">
              <strong className="dossier-meta-label">Location</strong>
              <span className="dossier-meta-value">{location}</span>
              {coordinates && (
                <span className="dossier-meta-caption">{coordinates}</span>
              )}
            </div>
            <div className="dossier-meta-group">
              <strong className="dossier-meta-label">Status</strong>
              <span className="dossier-meta-value">{example.status}</span>
            </div>
            <div className="dossier-meta-group">
              <strong className="dossier-meta-label">Period</strong>
              <span className="dossier-meta-value">{example.period}</span>
            </div>
            {readingMinutes > 0 && (
              <div className="dossier-meta-group">
                <strong className="dossier-meta-label">Reading time</strong>
                <span className="dossier-meta-value">
                  {readingMinutes} {readingMinutes === 1 ? 'minute' : 'minutes'}
                </span>
              </div>
            )}
            {sections.length > 0 && (
              <div className="dossier-meta-group">
                <strong className="dossier-meta-label">Contents</strong>
                <nav className="dossier-toc">
                  {sections.map((section) => (
                    <a key={section.id} href={`#${section.id}`}>
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>
            )}
          </aside>

          <article className="dossier-report">
            {loading && <p className="dossier-loading">Loading report...</p>}
            {loadError && <p className="dossier-error">{loadError}</p>}
            {!loading && !loadError && markdown && (
              <>
                <h1>{title}</h1>
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
              </>
            )}
          </article>

          {sources.length > 0 && (
            <section className="dossier-sources">
              <h2>Sources</h2>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
