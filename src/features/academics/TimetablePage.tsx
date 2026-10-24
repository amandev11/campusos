import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Printer, Users } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import {
  ACADEMIC_TERM,
  SESSIONS,
  WEEKDAYS,
  clockNow,
  courseByCode,
  sessionsForWeekday,
} from '@/data/academics';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  Badge,
  Button,
  DataOriginTag,
  EmptyState,
  Panel,
  SectionHeader,
  StatTile,
} from '@/components/ui/primitives';
import { FilterPill } from '@/components/ui/fields';
import { ModuleHero } from '@/features/shared';
import { useMinuteClock } from '@/hooks';
import type { Weekday } from '@/lib/types';

const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export default function TimetablePage() {
  const { state } = useApp();
  const now = useMinuteClock();
  const todayWeekday = now.getDay() === 0 ? 1 : (now.getDay() as Weekday);
  const [day, setDay] = useState<Weekday>(todayWeekday);
  const [view, setView] = useState<'week' | 'day'>('week');

  const daySessions = useMemo(() => sessionsForWeekday(day), [day]);

  const weekLoad = useMemo(
    () =>
      WEEKDAYS.map((entry) => ({
        ...entry,
        sessions: sessionsForWeekday(entry.value),
      })),
    [],
  );

  const totalHours = useMemo(
    () =>
      SESSIONS.reduce((sum, session) => sum + (minutesOf(session.end) - minutesOf(session.start)) / 60, 0),
    [],
  );

  const currentSession = daySessions.find(
    (session) => session.start <= clockNow(now) && session.end > clockNow(now),
  );

  const conflictToday = useMemo(() => {
    const sorted = [...daySessions].sort((a, b) => a.start.localeCompare(b.start));
    return sorted.some((session, index) => {
      const next = sorted[index + 1];
      return next ? session.end > next.start : false;
    });
  }, [daySessions]);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow={`${ACADEMIC_TERM.name} · Week ${ACADEMIC_TERM.weekNumber}`}
        title="Your timetable"
        description="Sessions, rooms and attendance standing in one grid. Weekend labs and tutorials are included, because that is when they actually happen."
        meta={
          <>
            <Badge tone="accent">{SESSIONS.length} weekly sessions</Badge>
            <Badge tone="teal">{totalHours.toFixed(1)} contact hours</Badge>
            <DataOriginTag origin="demo" />
          </>
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="md"
              icon={<Printer className="size-4" />}
              onClick={() => window.print()}
            >
              Print
            </Button>
            <Link
              to="/academics/attendance"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm text-fg transition-colors hover:border-line-strong"
            >
              <Users className="size-4" aria-hidden="true" />
              Attendance
            </Link>
          </>
        }
        aside={
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Today" value={sessionsForWeekday(todayWeekday).length} hint="Scheduled sessions" />
              <StatTile
                label="Busiest day"
                value={weekLoad.reduce((max, entry) => (entry.sessions.length > max.sessions.length ? entry : max), weekLoad[0]!).short}
                hint={`${weekLoad.reduce((max, entry) => Math.max(max, entry.sessions.length), 0)} sessions`}
              />
            </div>
            {currentSession ? (
              <div className="rounded-xl border border-accent/45 bg-accent-soft p-3.5">
                <p className="caps text-accent">In progress</p>
                <p className="mt-1.5 text-[0.8125rem] font-medium text-fg">
                  {courseByCode(currentSession.courseCode)?.title}
                </p>
                <p className="mt-0.5 text-[0.6875rem] text-accent">
                  {formatTime(currentSession.start)} – {formatTime(currentSession.end)} · {currentSession.room}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-line bg-surface/45 p-3.5">
                <p className="caps">Right now</p>
                <p className="mt-1.5 text-[0.8125rem] text-fg-muted">No session in progress.</p>
              </div>
            )}
          </div>
        }
      />

      {conflictToday ? (
        <Panel strength="quiet" className="border-warn/40">
          <p className="text-[0.8125rem] text-warn">
            Two sessions on this day overlap. Check with the department office — this is a sample timetable.
          </p>
        </Panel>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-line p-0.5">
          {(['week', 'day'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              aria-pressed={view === option}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                view === option ? 'bg-surface/80 text-fg' : 'text-fg-subtle hover:text-fg',
              )}
            >
              {option} view
            </button>
          ))}
        </div>
        {view === 'day' ? (
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((entry) => (
              <FilterPill
                key={entry.value}
                active={day === entry.value}
                onClick={() => setDay(entry.value)}
                count={sessionsForWeekday(entry.value).length}
              >
                {entry.short}
              </FilterPill>
            ))}
          </div>
        ) : null}
      </div>

      {view === 'week' ? (
        <Panel padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[54rem]">
              <div className="grid grid-cols-[4.5rem_repeat(6,1fr)] border-b border-line">
                <div className="p-3" />
                {WEEKDAYS.map((entry) => {
                  const isToday = entry.value === todayWeekday;
                  const count = sessionsForWeekday(entry.value).length;
                  return (
                    <button
                      key={entry.value}
                      type="button"
                      onClick={() => {
                        setDay(entry.value);
                        setView('day');
                      }}
                      className={cn(
                        'border-l border-line p-3 text-left transition-colors hover:bg-surface/50',
                        isToday && 'bg-accent-soft',
                      )}
                    >
                      <p className={cn('text-[0.8125rem] font-medium', isToday ? 'text-accent' : 'text-fg')}>
                        {entry.long}
                      </p>
                      <p className="mt-0.5 text-[0.6875rem] text-fg-subtle">
                        {count} {count === 1 ? 'session' : 'sessions'}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="relative grid grid-cols-[4.5rem_repeat(6,1fr)]">
                <div className="border-r border-line">
                  {HOURS.map((hour) => (
                    <div key={hour} className="h-16 border-b border-line px-3 pt-2">
                      <span className="numeric text-[0.6875rem] text-fg-subtle">{hour}</span>
                    </div>
                  ))}
                </div>
                {WEEKDAYS.map((entry) => (
                  <div key={entry.value} className="relative border-r border-line last:border-r-0">
                    {HOURS.map((hour) => (
                      <div key={hour} className="h-16 border-b border-line" />
                    ))}
                    {sessionsForWeekday(entry.value).map((session) => {
                      const course = courseByCode(session.courseCode);
                      const start = minutesOf(session.start);
                      const end = minutesOf(session.end);
                      const base = minutesOf('08:00');
                      const top = ((start - base) / 60) * 64;
                      const height = Math.max(30, ((end - start) / 60) * 64 - 4);
                      const isNow = entry.value === todayWeekday && session.start <= clockNow(now) && session.end > clockNow(now);
                      return (
                        <Link
                          key={session.id}
                          to={`/academics/courses/${session.courseCode}`}
                          className={cn(
                            'absolute inset-x-1.5 overflow-hidden rounded-lg border px-2 py-1.5 transition-all duration-200 hover:z-10 hover:shadow-elev-2',
                            isNow ? 'border-accent/60 bg-accent-soft' : 'border-line bg-raised/90 hover:border-line-strong',
                          )}
                          style={{ top, height, borderLeftColor: course?.accent, borderLeftWidth: 3 }}
                        >
                          <p className="truncate text-[0.6875rem] font-medium text-fg">
                            {course?.title ?? session.courseCode}
                          </p>
                          <p className="numeric mt-0.5 truncate text-[0.625rem] text-fg-subtle">
                            {session.start}–{session.end}
                          </p>
                          <p className="truncate text-[0.625rem] text-fg-subtle">{session.room}</p>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      ) : (
        <Panel>
          <SectionHeader
            eyebrow={WEEKDAYS.find((entry) => entry.value === day)?.long}
            title={`${daySessions.length} ${daySessions.length === 1 ? 'session' : 'sessions'}`}
            description="Attendance standing and rooms for each session. Tap a session to open the course."
          />
          {daySessions.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="size-5" aria-hidden="true" />}
              title="Nothing scheduled"
              description="No sessions on this day. Choose another day, or check the examination datesheet for papers."
              className="mt-5 border-none py-6"
            />
          ) : (
            <div className="mt-5 space-y-3">
              {daySessions.map((session) => {
                const course = courseByCode(session.courseCode);
                const isNow = session.start <= clockNow(now) && session.end > clockNow(now);
                return (
                  <Link
                    key={session.id}
                    to={`/academics/courses/${session.courseCode}`}
                    className={cn(
                      'flex flex-wrap items-center gap-4 rounded-2xl border p-4 transition-colors',
                      isNow ? 'border-accent/50 bg-accent-soft' : 'border-line bg-surface/40 hover:border-line-strong',
                    )}
                  >
                    <div className="w-20 shrink-0">
                      <p className="numeric text-[0.875rem] text-fg">{formatTime(session.start)}</p>
                      <p className="numeric text-[0.6875rem] text-fg-subtle">{formatTime(session.end)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-[0.9375rem] font-medium text-fg">
                        {course?.title}
                        <Badge tone="muted">{session.kind}</Badge>
                        {isNow ? <Badge tone="accent">Now</Badge> : null}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle">
                        <span className="numeric">{session.courseCode}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" aria-hidden="true" />
                          {session.room}
                        </span>
                        <span>{course?.faculty}</span>
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      <Panel strength="quiet">
        <p className="text-xs leading-relaxed text-fg-muted">
          {state.profile.role === 'student'
            ? 'Timetable data is sample content for the demonstration. Room changes published by the department appear in Notices and are reflected here once an institutional feed is connected.'
            : 'You are viewing the student timetable for this semester. Publishing a timetable requires the ERP integration.'}
        </p>
      </Panel>
    </div>
  );
}
