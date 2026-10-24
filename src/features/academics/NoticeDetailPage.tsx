import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bell, Paperclip, Pin } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { formatBytes, formatDateTime, formatDate, relativeTime } from '@/lib/format';
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
import { ReportButton, SaveButton } from '@/features/shared';
import { IMPORTANCE_LABEL, IMPORTANCE_TONE, CourseChip, NoticeCard } from './components';

export default function NoticeDetailPage() {
  const { noticeId } = useParams<{ noticeId: string }>();
  const navigate = useNavigate();
  const { notices, documents, state, markNoticeRead } = useApp();

  const notice = notices.find((entry) => entry.id === noticeId);
  const attachment = notice?.attachmentId
    ? documents.find((document) => document.id === notice.attachmentId)
    : undefined;

  useEffect(() => {
    if (notice) markNoticeRead(notice.id);
  }, [notice, markNoticeRead]);

  const related = useMemo(() => {
    if (!notice) return [];
    return notices
      .filter((entry) => entry.id !== notice.id)
      .filter((entry) => entry.courseCode === notice.courseCode || entry.category === notice.category)
      .slice(0, 3);
  }, [notices, notice]);

  if (!notice) {
    return (
      <EmptyState
        icon={<Bell className="size-5" aria-hidden="true" />}
        title="That notice is no longer available"
        description="It may have been withdrawn by the publisher. The notice centre still has everything currently live."
        action={
          <Link
            to="/academics/notices"
            className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover"
          >
            Back to notices
          </Link>
        }
      />
    );
  }

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

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <article className="min-w-0 space-y-5">
          <Panel>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={IMPORTANCE_TONE[notice.importance]}>{IMPORTANCE_LABEL[notice.importance]}</Badge>
              <Badge tone="muted">{notice.channel}</Badge>
              <Badge tone="neutral">{notice.category}</Badge>
              {notice.pinned ? (
                <Badge tone="accent" icon={<Pin className="size-3" aria-hidden="true" />}>
                  Pinned
                </Badge>
              ) : null}
              {notice.courseCode ? <CourseChip code={notice.courseCode} /> : null}
              <DataOriginTag origin={notice.origin} />
            </div>

            <h1 className="display mt-4 text-[1.75rem] leading-tight text-fg sm:text-[2.25rem]">{notice.title}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-fg-subtle">
              <span className="font-medium text-fg-muted">{notice.author}</span>
              <span>{notice.department}</span>
              <span>{formatDateTime(notice.publishedAt)}</span>
              <span>({relativeTime(notice.publishedAt)})</span>
            </div>

            <div className="mt-6 space-y-4">
              {notice.body.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-[0.9375rem] leading-relaxed text-fg-muted">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <SaveButton
                kind="notice"
                refId={notice.id}
                title={notice.title}
                subtitle={notice.channel}
                href={`/academics/notices/${notice.id}`}
                variant="secondary"
              />
              <ReportButton kind="notice" refId={notice.id} refLabel={notice.title} size="md" />
            </div>
          </Panel>

          {attachment ? (
            <Panel>
              <SectionHeader eyebrow="Attachment" title="Document referenced by this notice" />
              <Link
                to={`/academics/library/${attachment.id}`}
                className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-surface/45 p-3.5 transition-colors hover:border-line-strong"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface/60 text-accent">
                  <Paperclip className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.8125rem] font-medium text-fg">{attachment.title}</span>
                  <span className="mt-0.5 block text-[0.6875rem] text-fg-subtle">
                    {attachment.pages} pages · {formatBytes(attachment.sizeKb)} · uploaded {relativeTime(attachment.uploadedAt)}
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              </Link>
            </Panel>
          ) : null}

          <InlineNote tone="neutral" title="Where this notice came from">
            Published through the {notice.channel} channel as {notice.origin === 'institution'
              ? 'authorised content from an office or faculty member'
              : notice.origin === 'user'
                ? 'community content published by a student body'
                : 'sample demonstration content'}. CampusOS does not ingest private messaging groups and does not claim
            an official integration where none exists.
          </InlineNote>
        </article>

        <div className="space-y-4">
          <Panel strength="float" className="lg:sticky lg:top-24">
            <p className="caps">Notice details</p>
            <dl className="mt-3">
              <KeyValue label="Published">{formatDate(notice.publishedAt, 'long')}</KeyValue>
              <KeyValue label="Time">{formatDateTime(notice.publishedAt)}</KeyValue>
              <KeyValue label="Channel">{notice.channel}</KeyValue>
              <KeyValue label="Publisher">{notice.author}</KeyValue>
              <KeyValue label="Department">{notice.department}</KeyValue>
              <KeyValue label="Importance">{IMPORTANCE_LABEL[notice.importance]}</KeyValue>
              <KeyValue label="Scope">{notice.scope}</KeyValue>
              <KeyValue label="Category">{notice.category}</KeyValue>
            </dl>
            {notice.courseCode ? (
              <Link
                to={`/academics/courses/${notice.courseCode}`}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover"
              >
                Open the course page
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            ) : null}
          </Panel>

          <Panel strength="quiet">
            <p className="caps">Publishing rules</p>
            <p className="mt-2 text-xs leading-relaxed text-fg-subtle">
              Institutional notices are only published by authorised offices. Community notices are labelled and can be
              reported. If something here contradicts an official circular, the circular wins — and please report the
              discrepancy.
            </p>
          </Panel>
        </div>
      </div>

      {related.length > 0 ? (
        <Panel>
          <SectionHeader
            eyebrow="Related"
            title="Other notices worth reading"
            description="Matched on course or category."
          />
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {related.map((entry) => (
              <NoticeCard key={entry.id} notice={entry} isRead={state.readNotices.includes(entry.id)} />
            ))}
          </div>
        </Panel>
      ) : null}

      <Button variant="ghost" icon={<ArrowLeft className="size-4" />} onClick={() => navigate('/academics/notices')}>
        All notices
      </Button>
    </div>
  );
}
