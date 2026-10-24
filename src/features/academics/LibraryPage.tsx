import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, FileText, LayoutGrid, Library, List, Lock, Upload } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { COURSES, DOCUMENT_CATEGORIES, courseByCode } from '@/data/academics';
import { formatBytes, relativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  Badge,
  Button,
  DataOriginTag,
  EmptyState,
  InlineNote,
  Panel,
  SectionHeader,
  StatTile,
} from '@/components/ui/primitives';
import { FilterPill, SearchField, Select } from '@/components/ui/fields';
import { Tabs } from '@/components/ui/overlays';
import { ModuleHero, StretchedLink } from '@/features/shared';
import { CourseChip } from './components';
import type { DocumentCategory } from '@/lib/types';

export default function LibraryPage() {
  const { documents, state, toggleDocumentBookmark, profile } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<DocumentCategory | 'all'>('all');
  const [course, setCourse] = useState<string | null>(null);
  const [view, setView] = useState<'all' | 'bookmarked' | 'recent'>('all');
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const [sort, setSort] = useState<'recent' | 'title' | 'size'>('recent');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const items = documents.filter((document) => {
      if (category !== 'all' && document.category !== category) return false;
      if (course && document.courseCode !== course) return false;
      if (view === 'bookmarked' && !state.bookmarkedDocuments.includes(document.id)) return false;
      if (needle.length > 0) {
        const haystack = `${document.title} ${document.tags.join(' ')} ${document.uploadedBy} ${document.category} ${document.courseCode ?? ''} ${document.department}`.toLowerCase();
        if (!needle.split(/\s+/).every((term) => haystack.includes(term))) return false;
      }
      return true;
    });

    const sorted = [...items];
    if (sort === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'size') sorted.sort((a, b) => b.sizeKb - a.sizeKb);
    else sorted.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return view === 'recent' ? sorted.slice(0, 6) : sorted;
  }, [documents, category, course, view, query, sort, state.bookmarkedDocuments]);

  const bookmarked = state.bookmarkedDocuments.length;
  const restricted = documents.filter((document) => document.restricted).length;
  const totalPages = documents.reduce((sum, document) => sum + document.pages, 0);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Academic hub"
        title="Document library"
        description="Study notes, question papers, slides, course packs and official circulars — searchable by course, category and tag, with an inline viewer that does not require a download first."
        meta={
          <>
            <Badge tone="accent">{documents.length} documents</Badge>
            <Badge tone="muted">{totalPages.toLocaleString()} pages indexed</Badge>
            <Badge tone="warn">{restricted} restricted</Badge>
            <DataOriginTag origin="demo" />
          </>
        }
        actions={
          profile.role !== 'student' ? (
            <Link
              to="/academics/manage/document"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
            >
              <Upload className="size-4" aria-hidden="true" />
              Add a document
            </Link>
          ) : null
        }
        aside={
          <div className="space-y-3">
            <SearchField
              value={query}
              onChange={setQuery}
              size="lg"
              placeholder="Search titles, tags, courses"
              label="Search the document library"
            />
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Bookmarked" value={bookmarked} hint="Your shortlist" icon={<Bookmark className="size-4" />} />
              <StatTile label="Categories" value={DOCUMENT_CATEGORIES.length} hint="From notes to circulars" />
            </div>
          </div>
        }
      />

      <InlineNote tone="neutral" title="How documents are handled">
        Demo documents render a real, paginated preview built from structured content. Files you upload yourself are
        readable for this browser session and are not stored on a server, because no storage integration is configured.
        Viewing permissions for restricted documents depend on the ERP integration.
      </InlineNote>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          ariaLabel="Library views"
          variant="segmented"
          value={view}
          onChange={setView}
          tabs={[
            { value: 'all', label: 'Everything', count: documents.length },
            { value: 'recent', label: 'Recent' },
            { value: 'bookmarked', label: 'Bookmarked', count: bookmarked },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Sort documents"
            value={sort}
            onChange={(event) => setSort(event.target.value as typeof sort)}
            className="h-9 w-44 text-xs"
          >
            <option value="recent">Newest first</option>
            <option value="title">Title A–Z</option>
            <option value="size">Largest first</option>
          </Select>
          <div className="flex rounded-lg border border-line p-0.5">
            {(['list', 'grid'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-label={`${option} layout`}
                aria-pressed={layout === option}
                onClick={() => setLayout(option)}
                className={cn(
                  'rounded-md p-1.5 transition-colors',
                  layout === option ? 'bg-surface/80 text-fg' : 'text-fg-subtle hover:text-fg',
                )}
              >
                {option === 'list' ? <List className="size-4" aria-hidden="true" /> : <LayoutGrid className="size-4" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <FilterPill active={category === 'all'} onClick={() => setCategory('all')} count={documents.length}>
          All categories
        </FilterPill>
        {DOCUMENT_CATEGORIES.map((entry) => {
          const count = documents.filter((document) => document.category === entry.value).length;
          if (count === 0) return null;
          return (
            <FilterPill
              key={entry.value}
              active={category === entry.value}
              onClick={() => setCategory(entry.value)}
              count={count}
            >
              {entry.label}
            </FilterPill>
          );
        })}
        <span className="mx-1 hidden h-4 w-px bg-line-strong sm:block" aria-hidden="true" />
        {COURSES.slice(0, 5).map((entry) => {
          const count = documents.filter((document) => document.courseCode === entry.code).length;
          if (count === 0) return null;
          return (
            <FilterPill
              key={entry.code}
              active={course === entry.code}
              onClick={() => setCourse(course === entry.code ? null : entry.code)}
              count={count}
            >
              {entry.code}
            </FilterPill>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Library className="size-5" aria-hidden="true" />}
          title={view === 'bookmarked' ? 'Nothing bookmarked yet' : 'No documents match'}
          description={
            view === 'bookmarked'
              ? 'Bookmark documents and they collect here for quick access during revision.'
              : 'Try a different category, clear the course filter, or search for a course code such as CS301.'
          }
          action={
            view === 'bookmarked' ? (
              <Button variant="secondary" onClick={() => setView('all')}>
                Browse the library
              </Button>
            ) : null
          }
        />
      ) : (
        <div className={layout === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
          {filtered.map((document) => {
            const course = document.courseCode ? courseByCode(document.courseCode) : undefined;
            const isBookmarked = state.bookmarkedDocuments.includes(document.id);
            if (layout === 'grid') {
              return (
                <article
                  key={document.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface/40 transition-colors hover:border-line-strong"
                >
                  <div
                    className="relative border-b border-line p-4"
                    style={{ background: 'linear-gradient(150deg, var(--raised), var(--sunken))' }}
                  >
                    <p className="caps">{document.category.replace('-', ' ')}</p>
                    <p className="display mt-2 line-clamp-3 text-[1.0625rem] leading-tight text-fg">{document.title}</p>
                    <p className="numeric mt-3 text-[0.625rem] text-fg-subtle">
                      {document.pages} pages · {formatBytes(document.sizeKb)}
                    </p>
                    {document.restricted ? (
                      <span className="absolute right-3 top-3">
                        <Badge tone="warn" icon={<Lock className="size-3" aria-hidden="true" />}>
                          Restricted
                        </Badge>
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {course ? <CourseChip code={course.code} /> : <Badge tone="muted">{document.department}</Badge>}
                      {isBookmarked ? <Badge tone="accent">Bookmarked</Badge> : null}
                    </div>
                    <p className="mt-2 text-[0.6875rem] text-fg-subtle">
                      {document.uploadedBy} · {relativeTime(document.uploadedAt)}
                    </p>
                    <div className="mt-auto flex items-center gap-2 pt-4">
                      <Link
                        to={`/academics/library/${document.id}`}
                        className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-accent px-3 text-xs font-medium text-accent-ink transition-colors hover:bg-accent-hover"
                      >
                        Open viewer
                      </Link>
                      <Button
                        size="sm"
                        variant="quiet"
                        aria-pressed={isBookmarked}
                        onClick={() => toggleDocumentBookmark(document.id)}
                        icon={<Bookmark className={cn('size-3.5', isBookmarked && 'text-accent')} />}
                      >
                        {isBookmarked ? 'Saved' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            }

            return (
              <div
                key={document.id}
                className="group relative flex items-center gap-3.5 rounded-2xl border border-line bg-surface/40 p-3.5 transition-colors hover:border-line-strong"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="muted">{document.category.replace('-', ' ')}</Badge>
                    {course ? <CourseChip code={course.code} className="relative z-10" /> : null}
                    {document.restricted ? (
                      <Badge tone="warn" icon={<Lock className="size-3" aria-hidden="true" />}>
                        Restricted
                      </Badge>
                    ) : null}
                  </div>
                  <StretchedLink to={`/academics/library/${document.id}`} className="mt-2">
                    <h3 className="text-[0.875rem] font-medium leading-snug text-fg transition-colors group-hover:text-accent">
                      {document.title}
                    </h3>
                  </StretchedLink>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-fg-subtle">
                    <span>{document.uploadedBy}</span>
                    <span>
                      {document.pages} pages · {formatBytes(document.sizeKb)}
                    </span>
                    <span>{relativeTime(document.uploadedAt)}</span>
                    <DataOriginTag origin={document.origin} />
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={isBookmarked ? 'primary' : 'quiet'}
                  aria-pressed={isBookmarked}
                  onClick={() => toggleDocumentBookmark(document.id)}
                  icon={<Bookmark className="size-3.5" />}
                >
                  {isBookmarked ? 'Saved' : 'Save'}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Panel strength="quiet">
        <SectionHeader
          eyebrow="Upload rules"
          title="What can live in the library"
          description="Keeping this honest protects the institution as much as it protects students."
        />
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs leading-relaxed text-fg-muted">
          <li>
            <span className="flex items-center gap-2 font-medium text-fg">
              <FileText className="size-3.5 text-accent" aria-hidden="true" />
              PDF only
            </span>
            Uploads are restricted to PDF, capped at 2 MB, and validated in the browser.
          </li>
          <li>
            <span className="flex items-center gap-2 font-medium text-fg">
              <Lock className="size-3.5 text-warn" aria-hidden="true" />
              Permitted material
            </span>
            Course material shared by faculty, department circulars and documents you own the rights to distribute.
          </li>
          <li>
            <span className="flex items-center gap-2 font-medium text-fg">
              <Bookmark className="size-3.5 text-teal" aria-hidden="true" />
              Not permitted
            </span>
            Scans of copyrighted textbooks, purchased solutions manuals and any personal student records.
          </li>
          <li>
            <span className="flex items-center gap-2 font-medium text-fg">
              <Library className="size-3.5 text-accent" aria-hidden="true" />
              Restricted items
            </span>
            Marked documents show a restriction notice until an authorisation system is connected.
          </li>
        </ul>
      </Panel>
    </div>
  );
}
