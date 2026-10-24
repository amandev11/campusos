import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Lock,
  Minus,
  Plus,
} from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { courseByCode } from '@/data/academics';
import { formatBytes, formatDate, relativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  Badge,
  Button,
  DataOriginTag,
  EmptyState,
  InlineNote,
  KeyValue,
  Panel,
  SectionHeader,
} from '@/components/ui/primitives';
import { readSessionFile } from '@/lib/images';
import { ModuleHero, ReportButton, StretchedLink } from '@/features/shared';
import { CourseChip } from './components';

const ZOOM_STEPS = [0.85, 1, 1.15, 1.35];

export default function DocumentPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { documents, state, toggleDocumentBookmark } = useApp();
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(1);

  const document = documents.find((entry) => entry.id === documentId);
  const course = document?.courseCode ? courseByCode(document.courseCode) : undefined;
  const bookmarked = document ? state.bookmarkedDocuments.includes(document.id) : false;
  const sessionFile = document ? readSessionFile(document.id) ?? document.fileUrl : null;

  const related = useMemo(() => {
    if (!document) return [];
    return documents
      .filter((entry) => entry.id !== document.id)
      .filter((entry) => entry.courseCode === document.courseCode || entry.category === document.category)
      .slice(0, 4);
  }, [documents, document]);

  if (!document) {
    return (
      <EmptyState
        icon={<FileText className="size-5" aria-hidden="true" />}
        title="That document is not in the library"
        description="It may have been withdrawn or removed by its publisher. The library still has everything currently published."
        action={
          <Link
            to="/academics/library"
            className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover"
          >
            Back to the library
          </Link>
        }
      />
    );
  }

  const isRender = !sessionFile;
  const totalPages = sessionFile ? document.pages : document.preview.length;
  const current = isRender ? document.preview[page] : undefined;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs text-fg-subtle transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back
      </button>

      <ModuleHero
        eyebrow={`${document.category.replace('-', ' ')} · ${document.department}`}
        title={document.title}
        description={`Published by ${document.uploadedBy}, ${relativeTime(document.uploadedAt)}. ${
          isRender
            ? 'This preview is generated from structured sample content so the layout, pagination and navigation can be evaluated without a real file.'
            : 'You uploaded this file, so it is shown directly from this browser session.'
        }`}
        meta={
          <>
            {course ? <Badge tone="accent">{course.code}</Badge> : null}
            <Badge tone="muted">
              {document.pages} pages · {formatBytes(document.sizeKb)}
            </Badge>
            {document.restricted ? (
              <Badge tone="warn" icon={<Lock className="size-3" aria-hidden="true" />}>
                Restricted
              </Badge>
            ) : null}
            <DataOriginTag origin={document.origin} />
          </>
        }
        actions={
          <>
            <Button
              variant={bookmarked ? 'primary' : 'secondary'}
              icon={<Bookmark className="size-4" />}
              onClick={() => toggleDocumentBookmark(document.id)}
              aria-pressed={bookmarked}
            >
              {bookmarked ? 'Bookmarked' : 'Bookmark'}
            </Button>
            {sessionFile ? (
              <a
                href={sessionFile}
                download={`${document.title}.pdf`}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm text-fg transition-colors hover:border-line-strong"
              >
                <Download className="size-4" aria-hidden="true" />
                Download
              </a>
            ) : (
              <Button
                variant="quiet"
                icon={<Download className="size-4" />}
                onClick={() => undefined}
                disabled
                title="Downloads are disabled for generated previews"
              >
                Download unavailable
              </Button>
            )}
          </>
        }
      />

      {document.restricted ? (
        <InlineNote tone="warn" title="Restricted document">
          This item is marked as restricted. Access control would be enforced by the institution; here it only affects
          how the entry is labelled. Do not redistribute restricted material.
        </InlineNote>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-4">
          <Panel padded={false} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="numeric text-xs text-fg-muted">
                  Page {page + 1} of {totalPages}
                </span>
                <span className="text-[0.625rem] uppercase tracking-wider text-fg-subtle">
                  {isRender ? 'Generated preview' : 'Uploaded file'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="quiet"
                  icon={<ChevronLeft className="size-3.5" />}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="quiet"
                  trailingIcon={<ChevronRight className="size-3.5" />}
                  onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
                {isRender ? (
                  <div className="flex items-center gap-1 rounded-lg border border-line p-0.5">
                    <button
                      type="button"
                      aria-label="Zoom out"
                      onClick={() => setZoom((value) => ZOOM_STEPS[Math.max(0, ZOOM_STEPS.indexOf(value) - 1)]!)}
                      className="rounded p-1.5 text-fg-subtle transition-colors hover:text-fg"
                    >
                      <Minus className="size-3.5" aria-hidden="true" />
                    </button>
                    <span className="numeric px-1 text-[0.625rem] text-fg-subtle">{Math.round(zoom * 100)}%</span>
                    <button
                      type="button"
                      aria-label="Zoom in"
                      onClick={() =>
                        setZoom((value) => ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, ZOOM_STEPS.indexOf(value) + 1)]!)
                      }
                      className="rounded p-1.5 text-fg-subtle transition-colors hover:text-fg"
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="bg-sunken/60 p-4 sm:p-6">
              {sessionFile ? (
                <div className="overflow-hidden rounded-xl border border-line bg-raised">
                  <iframe
                    title={document.title}
                    src={`${sessionFile}#page=${page + 1}`}
                    className="h-[70vh] w-full"
                  />
                </div>
              ) : (
                <article
                  className="mx-auto origin-top rounded-lg border border-line bg-raised px-6 py-8 shadow-elev-2 transition-transform duration-300 sm:px-10 sm:py-12"
                  style={{ transform: `scale(${zoom})`, maxWidth: '42rem' }}
                >
                  {current ? (
                    <>
                      <p className="caps">{current.subheading}</p>
                      <h2 className="display mt-3 text-[1.5rem] leading-tight text-fg sm:text-[1.75rem]">
                        {current.heading}
                      </h2>
                      <div className="mt-6 space-y-4">
                        {current.blocks.map((block, index) => {
                          if (block.kind === 'callout') {
                            return (
                              <div
                                key={index}
                                className="rounded-lg border border-accent/35 bg-accent-soft px-3.5 py-3 text-[0.8125rem] leading-relaxed text-accent"
                              >
                                {block.text}
                              </div>
                            );
                          }
                          if (block.kind === 'formula') {
                            return (
                              <p
                                key={index}
                                className="numeric rounded-lg border border-line bg-surface/60 px-3.5 py-3 text-[0.8125rem] text-fg"
                              >
                                {block.text}
                              </p>
                            );
                          }
                          if (block.kind === 'list') {
                            return (
                              <ul key={index} className="space-y-2">
                                {block.text.split('|').map((item) => (
                                  <li key={item} className="flex gap-3 text-[0.875rem] leading-relaxed text-fg-muted">
                                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            );
                          }
                          return (
                            <p key={index} className="text-[0.875rem] leading-relaxed text-fg-muted">
                              {block.text}
                            </p>
                          );
                        })}
                      </div>
                      <p className="numeric mt-10 border-t border-line pt-3 text-[0.625rem] text-fg-subtle">
                        {document.title} · page {page + 1} of {totalPages}
                      </p>
                    </>
                  ) : null}
                </article>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPage(index)}
                    aria-label={`Go to page ${index + 1}`}
                    aria-current={index === page ? 'page' : undefined}
                    className={cn(
                      'numeric size-7 rounded-md border text-[0.625rem] transition-colors',
                      index === page
                        ? 'border-accent/50 bg-accent-soft text-accent'
                        : 'border-line text-fg-subtle hover:text-fg',
                    )}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <p className="text-[0.625rem] text-fg-subtle">
                {isRender
                  ? 'Preview pages render from structured content.'
                  : 'Shown from the file you uploaded in this session.'}
              </p>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel strength="float" className="lg:sticky lg:top-24">
            <p className="caps">File metadata</p>
            <dl className="mt-3">
              <KeyValue label="Publisher">{document.uploadedBy}</KeyValue>
              <KeyValue label="Published">{formatDate(document.uploadedAt, 'medium')}</KeyValue>
              <KeyValue label="Pages">{document.pages}</KeyValue>
              <KeyValue label="Size">{formatBytes(document.sizeKb)}</KeyValue>
              <KeyValue label="Category">{document.category.replace('-', ' ')}</KeyValue>
              <KeyValue label="Department">{document.department}</KeyValue>
              <KeyValue label="Opens">{document.downloads}</KeyValue>
              <KeyValue label="Access">{document.restricted ? 'Restricted' : 'Open to the institution'}</KeyValue>
            </dl>

            {course ? (
              <div className="relative mt-4 flex items-center justify-between gap-2 rounded-lg border border-line bg-surface/50 px-3 py-2.5 text-xs text-fg transition-colors hover:border-line-strong">
                <span className="flex min-w-0 items-center gap-2">
                  <CourseChip code={course.code} className="relative z-10" />
                  <StretchedLink to={`/academics/courses/${course.code}`} label={`Open ${course.title}`} className="min-w-0">
                    <span className="block truncate">{course.title}</span>
                  </StretchedLink>
                </span>
                <ChevronRight className="size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {document.tags.map((tag) => (
                <Badge key={tag} tone="muted">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="mt-4 border-t border-line pt-3">
              <ReportButton kind="document" refId={document.id} refLabel={document.title} />
            </div>
          </Panel>
        </div>
      </div>

      {related.length > 0 ? (
        <Panel>
          <SectionHeader
            eyebrow="Related material"
            title="Other documents like this"
            description="Matched on course or category."
          />
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {related.map((entry) => (
              <li key={entry.id}>
                <Link
                  to={`/academics/library/${entry.id}`}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface/45 p-3.5 transition-colors hover:border-line-strong"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface/60 text-accent">
                    <FileText className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[0.8125rem] text-fg">{entry.title}</span>
                    <span className="mt-0.5 block text-[0.6875rem] text-fg-subtle">
                      {entry.pages} pages · {relativeTime(entry.uploadedAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
