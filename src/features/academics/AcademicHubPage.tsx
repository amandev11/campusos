import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  Library,
  Megaphone,
  Users,
} from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import {
  ACADEMIC_TERM,
  CAMPUS_EVENTS,
  COURSES,
  EXAMS,
  clockNow,
  todaySessions,
  upcomingSessions,
} from '@/data/academics';
import { formatDate, formatTime, percent } from '@/lib/format';
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
import { MiniBars, Sparkline } from '@/components/ui/DataViz';
import { SmartImage } from '@/components/ui/SmartImage';
import { SessionRow, AssignmentRow, NoticeCard, CourseChip } from './components';
import { IntegrationNotice, ModuleHero } from '@/features/shared';
import { useMinuteClock } from '@/hooks';

export default function AcademicHubPage() {
  const { state, notices, assignments, documents, profile } = useApp();
  const now = useMinuteClock();
  const role = profile.role;

  const sessions = useMemo(() => todaySessions(now), [now]);
  const nextSessions = useMemo(() => upcomingSessions(now, 3), [now]);

  const openAssignments = useMemo(
    () => assignments.filter((assignment) => !state.submissions[assignment.id]).slice(0, 4),
    [assignments, state.submissions],
  );

  const attendance = useMemo(
    () =>
      COURSES.map((course) => ({
        course,
        value: percent(course.attendanceAttended, course.attendanceHeld),
      })).sort((a, b) => a.value - b.value),
    [],
  );

  const overallAttendance = percent(
    COURSES.reduce((sum, course) => sum + course.attendanceAttended, 0),
    COURSES.reduce((sum, course) => sum + course.attendanceHeld, 0),
  );

  const pendingGrading = useMemo(
    () => assignments.filter((assignment) => state.submissions[assignment.id] && state.submissions[assignment.id]!.marks == null),
    [assignments, state.submissions],
  );

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow={`${ACADEMIC_TERM.institution} · ${ACADEMIC_TERM.name}`}
        title="Academic hub"
        description="Timetable, attendance, assignments, notices and every course document, in one searchable place instead of five disconnected portals."
        meta={
          <>
            <Badge tone="teal">{ACADEMIC_TERM.department}</Badge>
            <Badge tone="accent">Semester {ACADEMIC_TERM.semester}</Badge>
            <Badge tone="muted">
              Week {ACADEMIC_TERM.weekNumber} of {ACADEMIC_TERM.totalWeeks}
            </Badge>
            <DataOriginTag origin="demo" />
          </>
        }
        actions={
          <>
            <Link
              to="/academics/timetable"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              Timetable
            </Link>
            <Link
              to="/academics/library"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm text-fg transition-colors hover:border-line-strong"
            >
              <Library className="size-4" aria-hidden="true" />
              Document library
            </Link>
          </>
        }
        aside={
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Courses" value={COURSES.length} hint={`${COURSES.reduce((sum, c) => sum + c.credits, 0)} credits`} />
            <StatTile label="Attendance" value={`${overallAttendance}%`} hint="Weighted average" tone={overallAttendance < 75 ? 'danger' : 'neutral'} />
            <StatTile
              label={role === 'faculty' ? 'To grade' : 'Open work'}
              value={role === 'faculty' ? pendingGrading.length : openAssignments.length}
              hint={role === 'faculty' ? 'Submitted, ungraded' : 'Unsubmitted assignments'}
            />
            <StatTile label="Documents" value={documents.length} hint="In your library" />
          </div>
        }
      />

      {role !== 'student' ? (
        <InlineNote tone="neutral" title={`Viewing as ${role}`}>
          {role === 'faculty'
            ? 'You can publish announcements, create assignments and add course material. Attendance and internal marks remain sample data because no institutional system is connected.'
            : 'You can publish institution-wide notices, manage documents and review parking operations. User access control and personal records require the ERP integration listed below.'}
        </InlineNote>
      ) : null}

      <IntegrationNotice integrationId="erp" />

      <div className="grid gap-5 xl:grid-cols-12">
        <Panel className="xl:col-span-7">
          <SectionHeader
            eyebrow="Today"
            title={sessions.length > 0 ? `Week ${ACADEMIC_TERM.weekNumber} · ${sessions.length} sessions` : 'No sessions today'}
            description={
              sessions.length > 0
                ? 'Your teaching day, with attendance standing beside every course.'
                : 'A clear day. Here is what is coming next.'
            }
          />
          <div className="mt-5 space-y-2.5">
            {sessions.length > 0
              ? sessions.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    isNow={session.start <= clockNow(now) && session.end > clockNow(now)}
                  />
                ))
              : nextSessions.map(({ session, offsetDays }) => (
                  <SessionRow key={session.id} session={session} offsetDays={offsetDays} showDay />
                ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/academics/attendance"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-xs text-fg transition-colors hover:border-line-strong"
            >
              Attendance detail
            </Link>
            <Link
              to="/academics/directory"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-xs text-fg transition-colors hover:border-line-strong"
            >
              <Users className="size-3.5" aria-hidden="true" />
              Faculty directory
            </Link>
          </div>
        </Panel>

        <Panel className="xl:col-span-5">
          <SectionHeader
            eyebrow="Attendance"
            title="Where you stand"
            description="Sample figures. Connect the institutional system to see official records."
            action={
              <Link to="/academics/attendance" className="text-xs font-medium text-accent hover:text-accent-hover">
                Details
              </Link>
            }
          />
          <div className="mt-5 space-y-3.5">
            {attendance.slice(0, 4).map(({ course, value }) => (
              <div key={course.code}>
                <div className="flex items-baseline justify-between gap-3">
                  <Link to={`/academics/courses/${course.code}`} className="text-xs text-fg hover:text-accent">
                    {course.code} · {course.title}
                  </Link>
                  <span className={cn('numeric text-xs', value < 75 ? 'text-danger' : value < 85 ? 'text-warn' : 'text-fg')}>
                    {value}%
                  </span>
                </div>
                <div className="mt-1.5">
                  <Meter
                    value={course.attendanceAttended}
                    max={course.attendanceHeld}
                    tone={value < 75 ? 'danger' : value < 85 ? 'warn' : 'teal'}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-line bg-surface/45 p-3.5">
            <div>
              <p className="caps">Internal assessment</p>
              <p className="numeric mt-1 text-sm text-fg">
                {COURSES.reduce((sum, course) => sum + course.continuousAssessment, 0)} /{' '}
                {COURSES.reduce((sum, course) => sum + course.continuousAssessmentMax, 0)}
              </p>
            </div>
            <Sparkline
              values={[52, 58, 61, 66, 70, 74, 78]}
              width={110}
              height={30}
              label="Internal assessment trend across the semester"
            />
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <Panel className="xl:col-span-7">
          <SectionHeader
            eyebrow="Coursework"
            title={role === 'faculty' ? 'Submissions to review' : 'Open assignments'}
            description={
              role === 'faculty'
                ? 'Work submitted by students on the courses you own. Grading here is stored locally.'
                : 'Unsubmitted work, ordered by how soon it falls due.'
            }
            action={
              <Link to="/academics/assignments" className="text-xs font-medium text-accent hover:text-accent-hover">
                All assignments
              </Link>
            }
          />
          <div className="mt-5 space-y-3">
            {role === 'faculty' ? (
              pendingGrading.length > 0 ? (
                pendingGrading.slice(0, 4).map((assignment) => (
                  <AssignmentRow
                    key={assignment.id}
                    assignment={assignment}
                    submitted
                    marks={state.submissions[assignment.id]?.marks ?? null}
                    marksMax={assignment.maxMarks}
                  />
                ))
              ) : (
                <EmptyState
                  icon={<ClipboardList className="size-5" aria-hidden="true" />}
                  title="Nothing waiting to be graded"
                  description="Submitted coursework appears here for review."
                  className="border-none py-6"
                />
              )
            ) : openAssignments.length > 0 ? (
              openAssignments.map((assignment) => (
                <AssignmentRow key={assignment.id} assignment={assignment} submitted={false} marksMax={assignment.maxMarks} />
              ))
            ) : (
              <EmptyState
                icon={<ClipboardList className="size-5" aria-hidden="true" />}
                title="All work submitted"
                description="Nothing outstanding across your registered courses."
                className="border-none py-6"
              />
            )}
          </div>
        </Panel>

        <Panel className="xl:col-span-5">
          <SectionHeader
            eyebrow="Examinations"
            title="Scheduled papers"
            description="Seat ranges are published with the datesheet."
            action={
              <Link to="/academics/exams" className="text-xs font-medium text-accent hover:text-accent-hover">
                Datesheet
              </Link>
            }
          />
          <div className="mt-5 space-y-2.5">
            {EXAMS.slice(0, 4).map((exam) => {
              const days = Math.ceil((new Date(exam.date).getTime() - now.getTime()) / 86400000);
              return (
                <div key={exam.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/45 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-[0.8125rem] text-fg">{exam.title}</p>
                    <p className="mt-0.5 text-[0.6875rem] text-fg-subtle">
                      {formatDate(exam.date, 'short')} · {exam.start} · {exam.hall}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge tone={days <= 7 ? 'warn' : 'muted'}>
                      {days > 0 ? `${days}d` : 'today'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel>
        <SectionHeader
          eyebrow="Announcements"
          title="Latest notices"
          description="Institution, department and course channels — clearly attributed."
          action={
            <Link to="/academics/notices" className="text-xs font-medium text-accent hover:text-accent-hover">
              Notice centre
            </Link>
          }
        />
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {notices.slice(0, 3).map((notice) => (
            <NoticeCard key={notice.id} notice={notice} isRead={state.readNotices.includes(notice.id)} />
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-12">
        <Panel className="xl:col-span-7">
          <SectionHeader
            eyebrow="Calendar"
            title="Upcoming events on campus"
            description="Academic events, workshops and placement activity."
          />
          {CAMPUS_EVENTS.length === 0 ? (
            <EmptyState title="No events listed" description="Events added by departments will appear here." className="mt-5 border-none py-6" />
          ) : (
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {CAMPUS_EVENTS.map((event) => (
                <li key={event.id} className="overflow-hidden rounded-xl border border-line">
                  <SmartImage src={event.image} alt="" ratio="16 / 9" sizes="(max-width: 640px) 90vw, 320px" />
                  <div className="p-3.5">
                    <p className="caps">{formatDate(event.date, 'short')}</p>
                    <p className="mt-1.5 text-[0.8125rem] font-medium text-fg">{event.title}</p>
                    <p className="mt-1 text-[0.6875rem] text-fg-subtle">
                      {event.venue} · {event.host}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="xl:col-span-5">
          <SectionHeader
            eyebrow="Weekly load"
            title="Contact hours by day"
            description="Scheduled sessions across the current timetable."
          />
          <div className="mt-6">
            <MiniBars
              ariaLabel="Contact hours by weekday"
              bars={[
                { label: 'Mon', value: 4, highlight: now.getDay() === 1 },
                { label: 'Tue', value: 3, highlight: now.getDay() === 2 },
                { label: 'Wed', value: 4, highlight: now.getDay() === 3 },
                { label: 'Thu', value: 3, highlight: now.getDay() === 4 },
                { label: 'Fri', value: 4, highlight: now.getDay() === 5 },
                { label: 'Sat', value: 2, highlight: now.getDay() === 6 },
              ]}
              max={4}
              height={72}
            />
          </div>
          <p className="mt-5 text-xs leading-relaxed text-fg-muted">
            {sessions.length > 0
              ? `Today has ${sessions.length} sessions, the busiest block starting at ${formatTime(sessions[0]!.start)}.`
              : 'No sessions today — the lightest day of the week.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {COURSES.map((course) => (
              <CourseChip key={course.code} code={course.code} />
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel padded>
          <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-fg">
            <Megaphone className="size-4 text-accent" aria-hidden="true" />
            Publish an announcement
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">
            Faculty can post to a course channel; administrators can post institution-wide.
          </p>
          <Link
            to="/academics/manage/notice"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover"
          >
            Open the composer
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Panel>
        <Panel padded>
          <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-fg">
            <FileText className="size-4 text-accent" aria-hidden="true" />
            Add course material
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">
            Upload a PDF with a real inline preview, tag it to a course and publish it to the library.
          </p>
          <Link
            to="/academics/manage/document"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover"
          >
            Upload a document
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Panel>
        <Panel padded>
          <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-fg">
            <GraduationCap className="size-4 text-accent" aria-hidden="true" />
            Set an assignment
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">
            Create work with a due date and marks available. Students see it immediately in their list.
          </p>
          <Link
            to="/academics/manage/assignment"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover"
          >
            Create an assignment
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Panel>
      </div>

      <Panel strength="quiet">
        <p className="flex items-start gap-2.5 text-xs leading-relaxed text-fg-muted">
          <BookOpen className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
          <span>
            <span className="block font-medium text-fg">What this module does and does not do</span>
            CampusOS never reads private messaging groups and never claims an official integration it does not have.
            Everything here arrives through authorised publishing, manual submission or an imported document. Attendance,
            internal marks and examination records stay clearly labelled sample data until an institutional API is
            connected.
          </span>
        </p>
      </Panel>
    </div>
  );
}
