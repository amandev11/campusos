import { Link } from 'react-router-dom';
import {
  BellRing,
  Check,
  CircleAlert,
  Clock,
  Download,
  FileText,
  Lock,
  MapPin,
  Paperclip,
  Pin,
  Users,
} from 'lucide-react';
import { courseByCode } from '@/data/academics';
import { deadlineLabel, formatBytes, formatDate, formatDuration, formatTime, percent, relativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Badge, DataOriginTag, Meter, StatusDot, type Tone } from '@/components/ui/primitives';
import { StretchedLink } from '@/features/shared';
import type { Assignment, CampusDocument, ClassSession, ExamEntry, Notice, NoticeImportance } from '@/lib/types';

export const IMPORTANCE_TONE: Record<NoticeImportance, Tone> = {
  critical: 'danger',
  high: 'warn',
  normal: 'neutral',
};

export const IMPORTANCE_LABEL: Record<NoticeImportance, string> = {
  critical: 'Critical',
  high: 'Important',
  normal: 'General',
};

export function CourseChip({ code, className }: { code: string; className?: string }) {
  const course = courseByCode(code);
  return (
    <Link
      to={`/academics/courses/${code}`}
      className={cn(
        'numeric inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[0.6875rem] transition-colors',
        'border-line bg-surface/60 text-fg-muted hover:border-line-strong hover:text-fg',
        className,
      )}
      style={course ? { borderColor: `${course.accent}44` } : undefined}
    >
      <span className="size-1.5 rounded-full" style={{ background: course?.accent ?? 'var(--fg-subtle)' }} aria-hidden="true" />
      {code}
    </Link>
  );
}

export function SessionRow({
  session,
  offsetDays = 0,
  showDay = false,
  isNow = false,
  attendanceKnown = true,
}: {
  session: ClassSession;
  offsetDays?: number;
  showDay?: boolean;
  isNow?: boolean;
  attendanceKnown?: boolean;
}) {
  const course = courseByCode(session.courseCode);
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors',
        isNow ? 'border-accent/45 bg-accent-soft' : 'border-line bg-surface/40',
      )}
    >
      <div className="w-14 shrink-0">
        <p className="numeric text-[0.8125rem] text-fg">{formatTime(session.start)}</p>
        <p className="numeric text-[0.6875rem] text-fg-subtle">{formatTime(session.end)}</p>
      </div>
      <span className="h-8 w-px shrink-0 bg-line-strong" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-fg">
          <span className="truncate">{course ? course.title : session.courseCode}</span>
          {isNow ? <Badge tone="accent">Now</Badge> : null}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle">
          <CourseChip code={session.courseCode} />
          <span className="flex items-center gap-1">
            <MapPin className="size-3" aria-hidden="true" />
            {session.room}
          </span>
          <span className="capitalize">{session.kind}</span>
          {showDay ? (
            <span>
              {offsetDays === 0 ? 'Today' : offsetDays === 1 ? 'Tomorrow' : formatDate(new Date(Date.now() + offsetDays * 86400000), 'short')}
            </span>
          ) : null}
        </p>
      </div>
      {attendanceKnown ? (
        <div className="hidden w-24 shrink-0 sm:block">
          <Meter
            value={course?.attendanceAttended ?? 0}
            max={course?.attendanceHeld ?? 1}
            tone={(course ? percent(course.attendanceAttended, course.attendanceHeld) : 0) < 75 ? 'warn' : 'teal'}
            showValue
            label="Attendance"
          />
        </div>
      ) : null}
    </div>
  );
}

export function NoticeCard({ notice, isRead }: { notice: Notice; isRead: boolean }) {
  return (
    <article
      className={cn(
        'group relative rounded-2xl border p-4 transition-all duration-300 hover:border-line-strong',
        isRead ? 'border-line bg-surface/30' : 'border-line bg-surface/55',
      )}
    >
      {!isRead ? (
        <span className="absolute left-0 top-5 h-6 w-[2px] rounded-r-full bg-accent" aria-hidden="true" />
      ) : null}
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={IMPORTANCE_TONE[notice.importance]}>
          {notice.importance === 'critical' ? <CircleAlert className="size-3" aria-hidden="true" /> : null}
          {IMPORTANCE_LABEL[notice.importance]}
        </Badge>
        {notice.pinned ? (
          <Badge tone="accent" icon={<Pin className="size-3" aria-hidden="true" />}>
            Pinned
          </Badge>
        ) : null}
        <Badge tone="muted">{notice.category}</Badge>
        {notice.courseCode ? <CourseChip code={notice.courseCode} /> : null}
        {!isRead ? <StatusDot tone="accent" /> : null}
      </div>
      <Link to={`/academics/notices/${notice.id}`} className="mt-2.5 block">
        <h3 className="text-[0.9375rem] font-medium leading-snug text-fg transition-colors group-hover:text-accent">
          {notice.title}
        </h3>
      </Link>
      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-fg-muted">{notice.body}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.6875rem] text-fg-subtle">
        <span className="flex items-center gap-1.5">
          <BellRing className="size-3" aria-hidden="true" />
          {notice.channel}
        </span>
        <span>{notice.department}</span>
        <span>{relativeTime(notice.publishedAt)}</span>
        {notice.attachmentId ? (
          <span className="flex items-center gap-1">
            <Paperclip className="size-3" aria-hidden="true" />
            Attachment
          </span>
        ) : null}
        <DataOriginTag origin={notice.origin} />
      </div>
    </article>
  );
}

export function AssignmentRow({
  assignment,
  submitted,
  marks,
  marksMax,
}: {
  assignment: Assignment;
  submitted: boolean;
  marks?: number | null;
  marksMax: number;
}) {
  const deadline = deadlineLabel(assignment.dueAt);
  const done = submitted;
  /**
   * The whole row behaves as a link, but the row itself must not be an anchor:
   * the course chip inside it is its own link, and nesting anchors is invalid
   * HTML that breaks keyboard and screen-reader navigation. The title link
   * stretches a transparent overlay across the row instead.
   */
  return (
    <article className="group relative flex items-start gap-3.5 rounded-2xl border border-line bg-surface/40 p-4 transition-all duration-300 hover:border-line-strong hover:bg-surface/60">
      <span
        className={cn(
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border',
          done ? 'border-ok/40 bg-ok-soft text-ok' : 'border-line bg-surface/60 text-fg-subtle',
        )}
      >
        {done ? <Check className="size-4" aria-hidden="true" /> : <FileText className="size-4" aria-hidden="true" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <CourseChip code={assignment.courseCode} className="relative z-10" />
          {marks != null ? <Badge tone="ok">{marks}/{marksMax}</Badge> : null}
        </div>
        <StretchedLink to={`/academics/assignments/${assignment.id}`} className="mt-2">
          <h3 className="text-[0.9375rem] font-medium leading-snug text-fg transition-colors group-hover:text-accent">
            {assignment.title}
          </h3>
        </StretchedLink>
        <p className="mt-1 line-clamp-1 text-xs text-fg-muted">{assignment.brief}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.6875rem] text-fg-subtle">
          <span className={cn(deadlineLabel(assignment.dueAt).tone === 'danger' && !done && 'text-danger', deadlineLabel(assignment.dueAt).tone === 'warn' && !done && 'text-warn')}>
            <Clock className="mr-1 inline size-3" aria-hidden="true" />
            {done ? `Submitted ${relativeTime(assignment.dueAt)}` : deadline.text}
          </span>
          <span>{formatDate(assignment.dueAt)} at {formatTime(new Date(assignment.dueAt).toTimeString().slice(0, 5))}</span>
          <span>{marksMax} marks</span>
        </div>
      </div>
    </article>
  );
}

export function DocumentRow({
  document,
  bookmarked,
  onBookmark,
}: {
  document: CampusDocument;
  bookmarked: boolean;
  onBookmark: () => void;
}) {
  const course = document.courseCode ? courseByCode(document.courseCode) : undefined;
  return (
    <div className="group relative flex items-center gap-3.5 rounded-2xl border border-line bg-surface/40 p-3.5 transition-all duration-300 hover:border-line-strong hover:bg-surface/60">
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
          <span>{document.pages} pages · {formatBytes(document.sizeKb)}</span>
          <span>{relativeTime(document.uploadedAt)}</span>
          <span className="flex items-center gap-1">
            <Download className="size-3" aria-hidden="true" />
            {document.downloads}
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={onBookmark}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? `Remove ${document.title} from bookmarks` : `Bookmark ${document.title}`}
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
          bookmarked ? 'border-accent/45 bg-accent-soft text-accent' : 'border-line text-fg-subtle hover:text-fg',
        )}
      >
        <FileText className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ExamRow({ exam }: { exam: ExamEntry }) {
  const days = Math.ceil((new Date(exam.date).getTime() - Date.now()) / 86400000);
  const course = courseByCode(exam.courseCode);
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface/40 p-4">
      <div className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-line bg-surface/60 py-2">
        <span className="numeric text-[1.125rem] leading-none text-fg">
          {new Date(exam.date).getDate()}
        </span>
        <span className="mt-1 text-[0.625rem] uppercase tracking-wider text-fg-subtle">
          {new Date(exam.date).toLocaleString('en-GB', { month: 'short' })}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <CourseChip code={exam.courseCode} />
          <Badge tone={exam.kind === 'viva' || exam.kind === 'practical' ? 'teal' : 'accent'}>
            {exam.kind === 'endsem' ? 'End semester' : exam.kind}
          </Badge>
          {days <= 7 ? <Badge tone="warn">In {days} days</Badge> : null}
        </div>
        <h3 className="mt-2 text-[0.875rem] font-medium text-fg">{course?.title ?? exam.title}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-fg-subtle">
          <span className="flex items-center gap-1">
            <Clock className="size-3" aria-hidden="true" />
            {exam.start} · {formatDuration(exam.durationMinutes)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3" aria-hidden="true" />
            {exam.hall}
          </span>
          <span>{exam.seatRange}</span>
        </p>
      </div>
    </div>
  );
}

export function AttendanceSummary({
  attended,
  held,
  compact = false,
}: {
  attended: number;
  held: number;
  compact?: boolean;
}) {
  const value = percent(attended, held);
  const tone: Tone = value >= 85 ? 'teal' : value >= 75 ? 'accent' : 'danger';
  return (
    <div className={cn('flex items-center gap-3', compact && 'gap-2')}>
      <div className="min-w-24 flex-1">
        <Meter value={attended} max={held || 1} tone={tone} />
      </div>
      <span className={cn('numeric text-xs', value < 75 ? 'text-danger' : 'text-fg')}>{value}%</span>
      {!compact ? (
        <span className="numeric text-[0.6875rem] text-fg-subtle">
          {attended}/{held}
        </span>
      ) : null}
    </div>
  );
}

export function FacultyLine({ name, department }: { name: string; department: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-fg-muted">
      <Users className="size-3 text-fg-subtle" aria-hidden="true" />
      {name} · {department}
    </span>
  );
}
