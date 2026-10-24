import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, Download, MapPin, ShieldCheck } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { ACADEMIC_TERM, EXAMS, courseByCode } from '@/data/academics';
import { formatDate, formatDuration } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  Badge,
  DataOriginTag,
  EmptyState,
  InlineNote,
  Panel,
  SectionHeader,
  StatTile,
} from '@/components/ui/primitives';
import { Tabs } from '@/components/ui/overlays';
import { ModuleHero } from '@/features/shared';
import { CourseChip } from './components';
import { useMinuteClock } from '@/hooks';

export default function ExamsPage() {
  const { documents } = useApp();
  const now = useMinuteClock();
  const [view, setView] = useState<'upcoming' | 'all' | 'practical'>('upcoming');

  const sorted = useMemo(
    () => [...EXAMS].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [],
  );

  const filtered = useMemo(() => {
    if (view === 'practical') return sorted.filter((exam) => exam.kind === 'practical' || exam.kind === 'viva');
    if (view === 'upcoming') return sorted.filter((exam) => new Date(exam.date).getTime() >= now.getTime() - 86400000);
    return sorted;
  }, [sorted, view, now]);

  const nextExam = filtered.find((exam) => new Date(exam.date).getTime() >= now.getTime());
  const daysToNext = nextExam
    ? Math.ceil((new Date(nextExam.date).getTime() - now.getTime()) / 86400000)
    : null;

  const datesheet = documents.find((document) => document.id === 'doc-datesheet');
  const totalMinutes = EXAMS.reduce((sum, exam) => sum + exam.durationMinutes, 0);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow={`${ACADEMIC_TERM.name} · End-semester`}
        title="Examination schedule"
        description="Papers, halls, seat ranges and durations, with the countdown to each. Bring your institute ID — entry closes shortly after the scheduled start."
        meta={
          <>
            <Badge tone="accent">{EXAMS.length} papers</Badge>
            <Badge tone="teal">{formatDuration(totalMinutes)} of examination time</Badge>
            <DataOriginTag origin="demo" />
          </>
        }
        actions={
          datesheet ? (
            <Link
              to={`/academics/library/${datesheet.id}`}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
            >
              <Download className="size-4" aria-hidden="true" />
              Open the datesheet
            </Link>
          ) : null
        }
        aside={
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                label="Next paper"
                value={daysToNext != null ? `${daysToNext}d` : '—'}
                hint={nextExam ? courseByCode(nextExam.courseCode)?.title : 'Nothing scheduled'}
                tone={daysToNext != null && daysToNext <= 7 ? 'warn' : 'neutral'}
              />
              <StatTile label="Halls used" value={new Set(EXAMS.map((exam) => exam.hall)).size} hint="Across all papers" />
            </div>
            {nextExam ? (
              <div className="rounded-xl border border-accent/45 bg-accent-soft p-3.5">
                <p className="caps text-accent">Next examination</p>
                <p className="mt-1.5 text-[0.8125rem] font-medium text-fg">
                  {courseByCode(nextExam.courseCode)?.title}
                </p>
                <p className="mt-0.5 text-[0.6875rem] text-accent">
                  {formatDate(nextExam.date, 'medium')} · {nextExam.start} · {nextExam.hall}
                </p>
              </div>
            ) : null}
          </div>
        }
      />

      <InlineNote tone="warn" title="Confirm everything with the examination cell">
        This datesheet is sample content. Seat allocations and any rescheduling are published by the Controller of
        Examinations — treat CampusOS as an organisational aid, not the official record.
      </InlineNote>

      <Tabs
        ariaLabel="Examination filters"
        variant="segmented"
        value={view}
        onChange={setView}
        tabs={[
          { value: 'upcoming', label: 'Upcoming', count: sorted.filter((e) => new Date(e.date).getTime() >= now.getTime() - 86400000).length },
          { value: 'practical', label: 'Practical & viva', count: sorted.filter((e) => e.kind === 'practical' || e.kind === 'viva').length },
          { value: 'all', label: 'Everything', count: sorted.length },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="size-5" aria-hidden="true" />}
          title="No papers in this view"
          description="Switch to everything to see the complete schedule for the semester."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((exam) => {
            const course = courseByCode(exam.courseCode);
            const days = Math.ceil((new Date(exam.date).getTime() - now.getTime()) / 86400000);
            const past = days < 0;
            return (
              <Panel
                key={exam.id}
                className={cn('flex flex-col gap-4 sm:flex-row sm:items-center', past && 'opacity-60')}
              >
                <div
                  className={cn(
                    'flex w-20 shrink-0 flex-col items-center rounded-xl border py-3',
                    days >= 0 && days <= 7 ? 'border-warn/45 bg-warn-soft' : 'border-line bg-surface/50',
                  )}
                >
                  <span className="numeric text-[1.375rem] leading-none text-fg">
                    {new Date(exam.date).getDate()}
                  </span>
                  <span className="mt-1 text-[0.625rem] uppercase tracking-wider text-fg-subtle">
                    {new Date(exam.date).toLocaleString('en-GB', { month: 'short' })}
                  </span>
                  <span className="mt-1 text-[0.625rem] text-fg-subtle">
                    {days === 0 ? 'Today' : past ? `${Math.abs(days)}d ago` : `in ${days}d`}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <CourseChip code={exam.courseCode} />
                    <Badge tone={exam.kind === 'practical' || exam.kind === 'viva' ? 'teal' : 'accent'}>
                      {exam.kind === 'endsem' ? 'End semester' : exam.kind === 'midsem' ? 'Mid semester' : exam.kind}
                    </Badge>
                    {days >= 0 && days <= 7 ? <Badge tone="warn">Soon</Badge> : null}
                  </div>
                  <h3 className="mt-2 text-[0.9375rem] font-medium text-fg">{course?.title ?? exam.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.6875rem] text-fg-subtle">
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3" aria-hidden="true" />
                      {exam.start} · {formatDuration(exam.durationMinutes)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3" aria-hidden="true" />
                      {exam.hall}
                    </span>
                    <span>{exam.seatRange}</span>
                    <span>{course?.faculty}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  <Link
                    to={`/academics/courses/${exam.courseCode}`}
                    className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-xs text-fg transition-colors hover:border-line-strong"
                  >
                    Course material
                  </Link>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      <Panel>
        <SectionHeader
          eyebrow="On the day"
          title="Examination rules worth re-reading"
          description="Standard institute practice. Confirm any changes with the examination cell."
        />
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            'Carry your institute ID card. Entry closes ten minutes after the scheduled start.',
            'Only approved calculators and instruments are permitted. Check the course circular.',
            'Mobile phones must be switched off and left at the front of the hall.',
            'Report to the seat printed on your admit card, not the seat you prefer.',
            'Answer booklets are collected at the end of the allotted time, with no grace period.',
            'For any medical absence, inform the examination cell the same day.',
          ].map((rule) => (
            <li key={rule} className="flex gap-3 text-xs leading-relaxed text-fg-muted">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-teal" aria-hidden="true" />
              {rule}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
