'use client';

import dynamic from 'next/dynamic';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ChevronRight,
  Globe2,
  Github,
  MapPin,
  Newspaper,
  Search,
  Send,
  Shuffle,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { archiveSearchUrl, isNigerianLocation } from '@/lib/archiving';
import { ReportPanel } from './report-panel';
import { AtlasDock } from './atlas-dock';
import { AtlasLegend } from './atlas-legend';
import { SubmissionForm } from '@/components/public/submission-form';
import {
  categories,
  type Category,
  type FailExample,
  type Location,
} from './types';

const AtlasGlobe = dynamic(
  () => import('./atlas-globe').then((module) => module.AtlasGlobe),
  { ssr: false },
);

interface PlaceResult {
  id: string;
  place_name: string;
  center: [number, number];
}

export function FailAtlas({ examples }: { examples: FailExample[] }) {
  const searchInput = useRef<HTMLInputElement>(null);
  const focusSearchOnOpen = useRef(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedExample, setSelectedExample] = useState<FailExample | null>(
    null,
  );
  const [focus, setFocus] = useState<Location | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [submissionFormOpen, setSubmissionFormOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const isMobileViewport = useRef(false);
  const [headingDocked, setHeadingDocked] = useState(false);
  const headingDockedRef = useRef(false);
  const [highlightId, setHighlightId] = useState<string | undefined>();
  const [mapless, setMapless] = useState(false);
  const [dbProjects, setDbProjects] = useState<FailExample[]>([]);
  const reportOpen = !!selectedExample;
  const inviteHidden = headingDocked || reportOpen || explorerOpen || mapless;

  // Fetch database projects and merge with static examples
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/projects', { signal: controller.signal })
      .then((response) => response.ok ? response.json() : { projects: [] })
      .then((data) => {
        const projects = (data.projects || []).map((project: any): FailExample => ({
          id: project.id,
          title: project.title,
          subtitle: project.subtitle || '',
          location: project.state || project.locationName,
          country: 'Nigeria',
          lat: parseFloat(project.lat),
          lng: parseFloat(project.lng),
          category: 'infrastructure' as const,
          status: project.status.charAt(0).toUpperCase() + project.status.slice(1),
          statusDate: project.updatedAt,
          period: project.startDate && project.expectedCompletion
            ? `${new Date(project.startDate).getFullYear()}–${new Date(project.expectedCompletion).getFullYear()}`
            : project.startDate
            ? `${new Date(project.startDate).getFullYear()}–present`
            : 'Date unknown',
          year: project.startDate 
            ? new Date(project.startDate).getFullYear() 
            : new Date(project.createdAt).getFullYear(),
          summary: project.reportContent
            ? project.reportContent.substring(0, 200).trim() + '...'
            : `${project.tier} project managed by ${project.mda}`,
          lesson: '',
          locationRole: project.locationRole || 'Project site',
          confidence: project.confidence || 'moderate',
          reportPath: '', // Database projects don't use file paths
          sources: [],
        }));
        setDbProjects(projects);
      })
      .catch(() => setDbProjects([]));
    
    return () => controller.abort();
  }, []);

  // Merge static examples with database projects
  const allExamples = useMemo(() => [...examples, ...dbProjects], [examples, dbProjects]);

  /**
   * On desktop the marker key is a permanent part of the atlas. On phones it
   * is a sheet, so it starts closed and can be opened with the right-hand
   * toggle.
   */
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    const update = () => {
      isMobileViewport.current = mql.matches;
      setLegendOpen(!mql.matches);
    };
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  const openSearch = useCallback(() => {
    focusSearchOnOpen.current = true;
    if (isMobileViewport.current) setLegendOpen(false);
    setExplorerOpen(true);
    requestAnimationFrame(() =>
      searchInput.current?.focus({ preventScroll: true }),
    );
  }, []);

  const filteredExamples = useMemo(
    () =>
      allExamples.filter(
        (example) =>
          (category === 'all' || example.category === category) &&
          `${example.title} ${example.subtitle} ${example.location} ${example.country} ${example.summary}`
            .toLowerCase()
            .includes(query.toLowerCase().trim()),
      ),
    [category, allExamples, query],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const caseId = params.get('case');
    if (caseId) {
      const example = allExamples.find((item) => item.id === caseId);
      if (example) {
        setSelectedExample(example);
        setFocus({
          name: example.location,
          latitude: example.lat,
          longitude: example.lng,
        });
        setExplorerOpen(false);
      }
    }
  }, [allExamples]);

  /**
   * The Mapbox geocoding endpoint completes the place-search box. It surfaces
   * the worldwide city list or national admin divisions instead of asking
   * users to remember coordinates.
   */
  useEffect(() => {
    const controller = new AbortController();
    if (!query.trim()) {
      setPlaces([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    void (async () => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        if (!token) return;
        const response = await fetch(
          `https://api.mapbox.com/search/geocode/v6/forward?${new URLSearchParams({
            q: query,
            access_token: token,
            types: 'country,region,district,place',
            limit: '5',
          })}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (controller.signal.aborted) return;
        const results = Array.isArray(data.features) ? data.features : [];
        setPlaces(
          results.map((item: any) => ({
            id: item.id || '',
            place_name: item.properties?.full_address || 'Unknown location',
            center:
              Array.isArray(item.geometry?.coordinates) &&
              item.geometry.coordinates.length === 2
                ? ([item.geometry.coordinates[0], item.geometry.coordinates[1]] as [
                    number,
                    number,
                  ])
                : [0, 0],
          })),
        );
      } catch {
        /* Curated reports stay available. */
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    })();
    return () => controller.abort();
  }, [query]);

  const chooseExample = useCallback(
    (example: FailExample) => {
      setSelectedExample(example);
      setFocus({
        name: example.location,
        latitude: example.lat,
        longitude: example.lng,
      });
      setExplorerOpen(false);
      window.history.replaceState({}, '', `/?case=${encodeURIComponent(example.id)}`);
    },
    [],
  );

  const chooseLocation = useCallback((location: Location) => {
    setFocus(location);
    setExplorerOpen(false);
  }, []);

  const closeReport = useCallback(() => {
    setSelectedExample(null);
    window.history.replaceState({}, '', '/');
  }, []);

  const randomExample = useCallback(() => {
    const filtered = filteredExamples;
    if (!filtered.length) return;
    const index = Math.floor(Math.random() * filtered.length);
    const example = filtered[index];
    if (example) chooseExample(example);
  }, [filteredExamples, chooseExample]);

  const trackZoom = useCallback((zoom: number) => {
    const zoomed = zoom > 2;
    headingDockedRef.current = zoomed;
    setHeadingDocked(zoomed);
  }, []);

  const globeUnavailable = useCallback(() => {
    setMapless(true);
  }, []);

  return (
    <div className="fail-atlas">
      <header className="atlas-heading" data-docked={headingDocked}>
        <div className="atlas-heading-inner">
          <div className="atlas-heading-mark">
            <h1>Progress Map</h1>
            <span className="atlas-heading-rule" aria-hidden="true" />
          </div>
          <p>
            <span data-line="full">
              Track Nigeria government projects from planning to completion.
            </span>
            {/* The corner has no room for the full line, and the wordmark
                still needs something under it. */}
            <span data-line="short" aria-hidden="true">
              Nigeria project atlas.
            </span>
          </p>
        </div>
      </header>
      <AtlasDock
        onHome={() => {
          closeReport();
          setExplorerOpen(false);
          setLegendOpen(false);
          setQuery('');
          setCategory('all');
          setFocus(null);
        }}
        onStories={() => {
          focusSearchOnOpen.current = false;
          setLegendOpen(false);
          setExplorerOpen(true);
        }}
        onRandom={randomExample}
        onAbout={() => setAboutOpen(true)}
        keyOpen={legendOpen}
      />
      <DialogPrimitive.Root open={explorerOpen} onOpenChange={setExplorerOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="atlas-overlay" />
          <DialogPrimitive.Content className="atlas-explorer">
            <div className="atlas-explorer-inner">
              <div className="atlas-explorer-heading">
                <DialogPrimitive.Title className="atlas-explorer-title">
                  Browse projects
                </DialogPrimitive.Title>
                <DialogPrimitive.Close className="atlas-explorer-close">
                  <X size={20} aria-hidden="true" />
                  <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
              </div>
              <div className="atlas-explorer-search">
                <Search size={18} className="atlas-explorer-search-icon" />
                <input
                  ref={searchInput}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by location, project name, or keyword..."
                  className="atlas-explorer-search-input"
                  autoFocus={focusSearchOnOpen.current}
                />
              </div>
              <div className="atlas-explorer-categories">
                {categories.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCategory(item.id)}
                    data-active={category === item.id}
                    className="atlas-category-button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="atlas-explorer-content">
                {searching && places.length === 0 && (
                  <p className="atlas-explorer-notice">Searching places...</p>
                )}
                {!searching && query && places.length > 0 && (
                  <div className="atlas-place-results">
                    <p className="atlas-place-results-label">
                      Places matching &ldquo;{query}&rdquo;
                    </p>
                    {places.map((place) => (
                      <button
                        key={place.id}
                        onClick={() => {
                          chooseLocation({
                            name: place.place_name,
                            latitude: place.center[1],
                            longitude: place.center[0],
                          });
                          setQuery('');
                          setPlaces([]);
                        }}
                        className="atlas-place-button"
                      >
                        <MapPin size={16} className="atlas-place-icon" />
                        <span>{place.place_name}</span>
                        <ChevronRight size={16} className="atlas-place-arrow" />
                      </button>
                    ))}
                  </div>
                )}
                <div className="atlas-example-list">
                  {filteredExamples.length === 0 && !searching && (
                    <p className="atlas-explorer-notice">
                      No projects match your search.
                    </p>
                  )}
                  {filteredExamples.map((example) => (
                    <button
                      key={example.id}
                      onClick={() => chooseExample(example)}
                      onMouseEnter={() => setHighlightId(example.id)}
                      onMouseLeave={() => setHighlightId(undefined)}
                      className="atlas-example-button"
                    >
                      <span className="atlas-example-button-title">
                        {example.title}
                      </span>
                      <span className="atlas-example-button-subtitle">
                        {example.subtitle}
                      </span>
                      <span className="atlas-example-button-meta">
                        {example.location} · {example.period}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
      <AtlasLegend
        open={legendOpen}
        onOpenChange={(open) => {
          if (!open) setLegendOpen(false);
        }}
        category={category}
        onCategory={setCategory}
        showPersonal={false}
      />
      <ReportPanel
        example={selectedExample}
        onClose={closeReport}
        onArchiveSearch={
          selectedExample && isNigerianLocation(selectedExample)
            ? () => {
                const url = archiveSearchUrl({
                  subject: selectedExample.title,
                  location: selectedExample.location,
                  year: selectedExample.year,
                  period: selectedExample.period,
                });
                if (url) window.open(url, '_blank', 'noopener,noreferrer');
              }
            : undefined
        }
      />
      {!inviteHidden && (
        <aside className="atlas-invite">
          <Globe2 size={18} aria-hidden="true" />
          <p>Choose a pin or search for a Nigeria government project</p>
        </aside>
      )}
      {/* 
        Mounted last so the twenty markers no longer sit in front of every
        control in tab order. The globe is the painted background either way:
        it takes z-index 0 and the chrome above it keeps z-index 2 and up.
      */}
      <AtlasGlobe
        examples={filteredExamples}
        investigations={[]}
        paused={reportOpen}
        focus={focus}
        highlightId={highlightId}
        onExample={chooseExample}
        onInvestigation={() => {}}
        onLocation={chooseLocation}
        onZoom={(zoom) => {
          const zoomed = zoom > 2;
          headingDockedRef.current = zoomed;
          setHeadingDocked(zoomed);
        }}
        onUnavailable={globeUnavailable}
        researchOnMapClick={false}
        keyOpen={legendOpen}
        onKey={() => {
          setExplorerOpen(false);
          setLegendOpen((open) => !open);
        }}
      />
      <footer className="atlas-footer">
        <a
          className="atlas-github"
          href="https://github.com/jsodeh/global-fail-map"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View source on GitHub"
          title="View source on GitHub"
        >
          <Github size={16} aria-hidden="true" />
        </a>
      </footer>
      
      
      {/* Submission Form Dialog - REMOVED PER USER REQUEST */}
      {/* <SubmissionForm
        open={submissionFormOpen}
        onOpenChange={setSubmissionFormOpen}
      /> */}
      
      {notice && (
        <div className="atlas-toast" role="status">
          {notice}
          <button
            onClick={() => setNotice('')}
            className="atlas-toast-close"
            aria-label="Dismiss"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="about-dialog">
          <DialogTitle>Progress Map</DialogTitle>
          <DialogDescription>
            An atlas of Nigeria government projects tracking progress from planning to completion.
          </DialogDescription>
          <p>
            Choose a pin to read one of {examples.length} project reports, or
            search for any Nigeria government project.
          </p>
          <p>
            Every report follows cited evidence. Track federal, state, and LGA
            projects with budget data, status updates, and progress timelines.
          </p>
          <div className="about-links">
            <a
              className="primary-button"
              href="https://github.com/jsodeh/global-fail-map"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub <ArrowUpRight size={16} />
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
