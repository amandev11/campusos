import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, TriangleAlert, Users } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { ACADEMIC_TERM, COURSES, SESSIONS } from '@/data/academics';
import { formatDate, percent } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  Badge,
  DataOriginTag,
  EmptyState,
  InlineNote,
  Meter,
  Panel,
  SectionHeader,
  StatTile,
} from '@/components/ui/primitives';
import { DonutRing, Legend, Sparkline } from '@/components/ui/DataViz';
import { ModuleHero } from '@/features/shared';

const REQUIRED_PERCENT = 75;

export default function AttendancePage() {
  const { profile } = useApp();

  const rows = useMemo(
    () =>
      COURSES.map((course) => {
        const value = percent(course.attendanceAttended, course.attendanceHeld);
        const sessions = SESSIONS.filter((session) => session.courseCode === course.code).length;
        const perWeek = sessions;
        const missed = course.attendanceHeld - course.attendanceAttended;
        /** Sessions you can still miss while staying above the requirement. */
        const buffer = Math.floor((course.attendanceAttended - (REQUIRED_PERCENT / 100) * course.attendanceHeld) / (REQUIRED_PERCENT / 100));
        /** Sessions you must attend in a row to climb back above it. */
        const needed = value >= REQUIRED_PERCENT ? 0 : Math.ceil(((REQUIRED_PERCENT / 100) * course.attendanceHeld - course.attendanceAttended) / (1 - REQUIRED_PERCENT / 100));
        return { course, value, missed, perWeek, buffer, needed };
      }).sort((a, b) => a.value - b.value),
    [],
  );

  const overall = percent(
    COURSES.reduce((sum, course) => sum + course.attendanceAttended, 0),
    COURSES.reduce((sum, course) => sum + course.attendanceHeld, 0),
  );

  const atRisk = rows.filter((row) => row.value < REQUIRED_PERCENT);
  const watchlist = rows.filter((row) => row.value >= REQUIRED_PERCENT && row.value < 80);
  const held = COURSES.reduce((sum, course) => sum + course.attendanceHeld, 0);
  const attended = COURSES.reduce((sum, course) => sum + course.attendanceAttended, 0);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow={`${ACADEMIC_TERM.name} · Week ${ACADEMIC_TERM.weekNumber}`}
        title="Attendance"
        description="Where every course stands against the institutional requirement, and how many sessions are needed to get back above it where you have slipped."
        meta={
          <>
            <Badge tone={overall < REQUIRED_PERCENT ? 'danger' : 'teal'}>{overall}% overall</Badge>
            <Badge tone="muted">
              {attended} of {held} sessions attended
            </Badge>
            <Badge tone="warn">Requirement {REQUIRED_PERCENT}%</Badge>
            <DataOriginTag origin="demo" />
          </>
        }
        aside={
          <div className="flex items-center gap-5">
            <DonutRing
              ariaLabel={`Overall attendance ${overall}%`}
              size={124}
              centerValue={`${overall}%`}
              centerLabel="Overall"
              segments={[
                { label: 'Attended', value: attended, colour: 'var(--teal)' },
                { label: 'Missed', value: held - attended, colour: 'var(--danger)' },
              ]}
            />
            <Legend
              items={[
                { label: 'Attended', colour: 'var(--teal)', value: `${attended}` },
                { label: 'Missed', colour: 'var(--danger)', value: `${held - attended}` },
              ]}
            />
          </div>
        }
      />

      <InlineNote tone="warn" title="Sample records, not official ones">
        These figures are demonstration data. Attendance is enforced by your institution, and only the registrar can
        confirm your standing. Connect the ERP integration in Settings to replace this with live records.
      </InlineNote>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Courses tracked" value={COURSES.length} hint={`${COURSES.reduce((s, c) => s + c.credits, 0)} credits`} />
        <StatTile
          label="At risk"
          value={atRisk.length}
          hint={`Below ${REQUIRED_PERCENT}%`}
          tone={atRisk.length > 0 ? 'danger' : 'neutral'}
          icon={<TriangleAlert className="size-4" />}
        />
        <StatTile label="Watchlist" value={watchlist.length} hint="Between 75% and 80%" tone="accent" />
        <StatTile label="Sessions held" value={held} hint="Across the semester" icon={<CalendarDays className="size-4" />} />
      </div>

      {atRisk.length > 0 ? (
        <Panel className="border-danger/35">
          <SectionHeader
            eyebrow="Action needed"
            title={`${atRisk.length} ${atRisk.length === 1 ? 'course is' : 'courses are'} below the requirement`}
            description="Attendance below the threshold can bar you from the end-semester examination. Speak to the course faculty early — most departments allow a documented exception."
          />
          <ul className="mt-5 space-y-4">
            {atRisk.map(({ course, value, needed }) => (
              <li key={course.code} className="rounded-xl border border-danger/30 bg-danger-soft p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Link to={`/academics/courses/${course.code}`} className="text-[0.875rem] font-medium text-fg hover:text-accent">
                    {course.code} · {course.title}
                  </Link>
                  <span className="numeric text-sm text-danger">{value}%</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-fg-muted">
                  Attending the next {needed} {needed === 1 ? 'session' : 'sessions'} in a row would bring you back above{' '}
                  {REQUIRED_PERCENT}%. {course.faculty} holds office hours as listed in the directory.
                </p>
                <div className="mt-2.5">
                  <Meter value={course.attendanceAttended} max={course.attendanceHeld} tone="danger" />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <Panel strength="quiet">
          <p className="text-[0.8125rem] text-fg">
            Every course is currently above the {REQUIRED_PERCENT}% requirement. Keep an eye on the watchlist below.
          </p>
        </Panel>
      )}

      <Panel>
        <SectionHeader
          eyebrow="Per course"
          title="Where every subject stands"
          description="Sessions attended, sessions held, and how much room you have before the requirement bites."
        />
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="py-2.5 pr-4 text-[0.6875rem] font-medium uppercase tracking-wider text-fg-subtle">Course</th>
                <th className="px-4 py-2.5 text-[0.6875rem] font-medium uppercase tracking-wider text-fg-subtle">Faculty</th>
                <th className="px-4 py-2.5 text-[0.6875rem] font-medium uppercase tracking-wider text-fg-subtle">Attended</th>
                <th className="px-4 py-2.5 text-[0.6875rem] font-medium uppercase tracking-wider text-fg-subtle">Standing</th>
                <th className="px-4 py-2.5 text-[0.6875rem] font-medium uppercase tracking-wider text-fg-subtle">Margin</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ course, value, buffer, perWeek }) => (
                <tr key={course.code} className="border-b border-line last:border-b-0">
                  <td className="py-3.5 pr-4">
                    <Link to={`/academics/courses/${course.code}`} className="block text-[0.8125rem] text-fg hover:text-accent">
                      {course.title}
                    </Link>
                    <span className="numeric mt-0.5 block text-[0.6875rem] text-fg-subtle">
                      {course.code} · {perWeek} weekly {perWeek === 1 ? 'session' : 'sessions'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-fg-muted">{course.faculty}</td>
                  <td className="numeric px-4 py-3.5 text-xs text-fg">
                    {course.attendanceAttended}/{course.attendanceHeld}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-28">
                        <Meter
                          value={course.attendanceAttended}
                          max={course.attendanceHeld}
                          tone={value < REQUIRED_PERCENT ? 'danger' : value < 85 ? 'warn' : 'teal'}
                        />
                      </div>
                      <span className={cn('numeric text-xs', value < REQUIRED_PERCENT ? 'text-danger' : 'text-fg')}>
                        {value}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs">
                    {value < REQUIRED_PERCENT ? (
                      <Badge tone="danger">Below requirement</Badge>
                    ) : buffer >= 3 ? (
                      <span className="text-fg-subtle">Can miss {buffer} more</span>
                    ) : (
                      <Badge tone="warn">Tight — {buffer} left</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <SectionHeader
            eyebrow="Trend"
            title="Attendance across the semester"
            description="Weekly cumulative attendance. Sample data — a real trend requires session-level records."
          />
          <div className="mt-6">
            <Sparkline
              values={[100, 96, 94, 91, 89, 88, 86, 84]}
              width={320}
              height={80}
              label="Attendance trend over the last eight weeks"
              className="w-full"
            />
          </div>
          <div className="mt-4 flex items-center justify-between text-[0.6875rem] text-fg-subtle">
            <span>Week 1</span>
            <span>Week {ACADEMIC_TERM.weekNumber}</span>
          </div>
        </Panel>

        <Panel>
          <SectionHeader eyebrow="Your role" title="What attendance means here" />
          {profile.role === 'student' ? (
            <ul className="mt-4 space-y-3 text-xs leading-relaxed text-fg-muted">
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                The requirement shown is the commonly applied {REQUIRED_PERCENT}% rule. Your department may apply
                different rules for labs and tutorials.
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                Medical and institute-duty leave normally counts as attended once documented with the department.
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                Talk to the course faculty before the end of term — most shortages are resolved without penalty when
                raised early.
              </li>
            </ul>
          ) : profile.role === 'faculty' ? (
            <ul className="mt-4 space-y-3 text-xs leading-relaxed text-fg-muted">
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                Course-level attendance entry requires the ERP integration. Until then this view is read-only sample
                data.
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                Publish shortage warnings as a course announcement so students hear it from you first.
              </li>
            </ul>
          ) : (
            <ul className="mt-4 space-y-3 text-xs leading-relaxed text-fg-muted">
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                Institution-wide attendance reporting depends on the ERP integration.
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                Publication of examination eligibility lists is not enabled here because it would require verified
                records.
              </li>
            </ul>
          )}
          <div className="mt-5 flex items-center gap-2 text-[0.6875rem] text-fg-subtle">
            <Users className="size-3" aria-hidden="true" />
            Requirement applied: {REQUIRED_PERCENT}% · updated {formatDate(new Date(), 'short')}
          </div>
        </Panel>
      </div>

      {COURSES.length === 0 ? (
        <EmptyState title="No courses registered" description="Once you register for courses, attendance appears here." />
      ) : null}
    </div>
  );
}
