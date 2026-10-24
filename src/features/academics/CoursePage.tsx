import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, ClipboardList, Clock, FileText, GraduationCap, Users } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { COURSES, FACULTY, SESSIONS, courseByCode, sessionsForWeekday } from '@/data/academics';
import { BOOKS } from '@/data/books';
import { formatDate, formatTime, percent } from '@/lib/format';
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
import { Tabs } from '@/components/ui/overlays';
import { DonutRing } from '@/components/ui/DataViz';
import { ModuleHero } from '@/features/shared';
import { AssignmentRow, DocumentRow, NoticeCard, SessionRow } from './components';
import { BookCard } from '@/features/books/components';
import type { Weekday } from '@/lib/types';

export default function CoursePage() {
  const { courseCode } = useParams<{ courseCode: string }>();
  const navigate = useNavigate();
  const { state, notices, assignments, documents, toggleDocumentBookmark } = useApp();
  const [tab, setTab] = useState<'overview' | 'sessions' | 'work' | 'material' | 'notices'>('overview');

  const course = courseCode ? courseByCode(courseCode) : undefined;

  const courseNotices = useMemo(
    () => notices.filter((notice) => notice.courseCode === courseCode),
    [notices, courseCode],
  );
  const courseAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.courseCode === courseCode),
    [assignments, courseCode],
  );
  const courseDocuments = useMemo(
    () => documents.filter((document) => document.courseCode === courseCode),
    [documents, courseCode],
  );
  const courseBooks = useMemo(
    () => BOOKS.filter((book) => book.courseCodes.includes(courseCode ?? '')).slice(0, 4),
    [courseCode],
  );
  const courseSessions = useMemo(
    () => SESSIONS.filter((session) => session.courseCode === courseCode),
    [courseCode],
  );

  const faculty = course ? FACULTY.find((member) => member.id === course.facultyId) : undefined;

  if (!course) {
    return (
      <EmptyState
        icon={<GraduationCap className="size-5" aria-hidden="true" />}
        title="That course is not in your registration"
        description="Course pages exist for the courses on your current registration. Browse the timetable to see everything you are enrolled in."
        action={
          <Link
            to="/academics"
            className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover"
          >
            Back to the academic hub
          </Link>
        }
      />
    );
  }

  const attendancePercent = percent(course.attendanceAttended, course.attendanceHeld);

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
        eyebrow={`${course.code} · ${course.department}`}
        title={course.title}
        description={`Taught by ${course.faculty}. ${course.credits} credits this semester, with ${courseSessions.length} scheduled sessions each week.`}
        meta={
          <>
            <Badge tone="accent">{course.credits} credits</Badge>
            <Badge tone={attendancePercent < 75 ? 'danger' : 'teal'}>{attendancePercent}% attendance</Badge>
            <Badge tone="muted">{courseAssignments.length} assignments</Badge>
            <DataOriginTag origin="demo" />
          </>
        }
        aside={
          <div className="space-y-4">
            <DonutRing
              ariaLabel={`Attendance ${attendancePercent}%`}
              size={116}
              thickness={11}
              centerValue={`${attendancePercent}%`}
              centerLabel="Attendance"
              segments={[
                { label: 'Attended', value: course.attendanceAttended, colour: course.accent },
                { label: 'Missed', value: course.attendanceHeld - course.attendanceAttended, colour: 'var(--danger)' },
              ]}
            />
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                label="Sessions"
                value={`${course.attendanceAttended}/${course.attendanceHeld}`}
                hint="Attended of held"
              />
              <StatTile
                label="Assessment"
                value={`${course.continuousAssessment}/${course.continuousAssessmentMax}`}
                hint="Internal marks"
              />
            </div>
          </div>
        }
      />

      <Tabs
        ariaLabel="Course sections"
        variant="scroll"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'sessions', label: 'Timetable', count: courseSessions.length },
          { value: 'work', label: 'Assignments', count: courseAssignments.length },
          { value: 'material', label: 'Material', count: courseDocuments.length },
          { value: 'notices', label: 'Notices', count: courseNotices.length },
        ]}
      />

      {tab === 'overview' ? (
        <div className="grid gap-5 xl:grid-cols-12">
          <Panel className="xl:col-span-7">
            <SectionHeader
              eyebrow="This week"
              title="Scheduled sessions"
              description="Rooms and types as published by the department."
            />
            <div className="mt-5 space-y-2.5">
              {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const).map((_, index) => {
                const sessions = sessionsForWeekday((index + 1) as Weekday).filter(
                  (session) => session.courseCode === course.code,
                );
                if (sessions.length === 0) return null;
                return sessions.map((session) => (
                  <SessionRow key={session.id} session={session} showDay offsetDays={index - new Date().getDay() + 1} />
                ));
              })}
            </div>
          </Panel>

          <div className="space-y-5 xl:col-span-5">
            {faculty ? (
              <Panel>
                <SectionHeader eyebrow="Teaching" title="Who runs this course" />
                <div className="mt-4 flex items-start gap-3.5">
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-medium text-fg">{faculty.name}</p>
                    <p className="mt-0.5 text-xs text-fg-muted">{faculty.title}</p>
                    <p className="mt-2 text-xs text-fg-muted">
                      {faculty.cabin} · office hours {faculty.hours}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {faculty.researchAreas.map((area) => (
                        <Badge key={area} tone="muted">
                          {area}
                        </Badge>
                      ))}
                    </div>
                    <Link
                      to={`/academics/directory?q=${encodeURIComponent(faculty.name)}`}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover"
                    >
                      <Users className="size-3.5" aria-hidden="true" />
                      Directory entry
                    </Link>
                  </div>
                </div>
              </Panel>
            ) : null}

            <Panel>
              <SectionHeader
                eyebrow="Assessment"
                title="How marks are made up"
                description="Internal marks shown are sample data."
              />
              <div className="mt-4 space-y-3.5">
                <div>
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="text-fg-muted">Continuous assessment</span>
                    <span className="numeric text-fg">
                      {course.continuousAssessment}/{course.continuousAssessmentMax}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <Meter
                      value={course.continuousAssessment}
                      max={course.continuousAssessmentMax}
                      tone="accent"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="text-fg-muted">Attendance standing</span>
                    <span className={`numeric ${attendancePercent < 75 ? 'text-danger' : 'text-fg'}`}>
                      {attendancePercent}%
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <Meter
                      value={course.attendanceAttended}
                      max={course.attendanceHeld}
                      tone={attendancePercent < 75 ? 'danger' : 'teal'}
                    />
                  </div>
                </div>
              </div>
              <p className="mt-4 text-[0.6875rem] leading-relaxed text-fg-subtle">
                End-semester weight and pass criteria come from the published course syllabus. Open the document library
                for the current version.
              </p>
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === 'sessions' ? (
        <Panel>
          <SectionHeader
            eyebrow="Weekly pattern"
            title={`${courseSessions.length} sessions per week`}
            description="Lecture, lab and tutorial slots for this course."
          />
          <div className="mt-5 space-y-2.5">
            {courseSessions.map((session) => (
              <SessionRow key={session.id} session={session} showDay attendanceKnown={false} />
            ))}
          </div>
          <InlineNote tone="neutral" className="mt-5">
            Room changes are published in the course notice channel and reflected here once an institutional feed is
            connected.
          </InlineNote>
        </Panel>
      ) : null}

      {tab === 'work' ? (
        courseAssignments.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="size-5" aria-hidden="true" />}
            title="No assignments yet"
            description="Work published for this course appears here with its deadline and marks."
          />
        ) : (
          <div className="space-y-3">
            {courseAssignments
              .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
              .map((assignment) => {
                const submission = state.submissions[assignment.id];
                return (
                  <AssignmentRow
                    key={assignment.id}
                    assignment={assignment}
                    submitted={Boolean(submission)}
                    marks={submission?.marks ?? null}
                    marksMax={assignment.maxMarks}
                  />
                );
              })}
          </div>
        )
      ) : null}

      {tab === 'material' ? (
        <div className="space-y-5">
          {courseDocuments.length === 0 ? (
            <EmptyState
              icon={<FileText className="size-5" aria-hidden="true" />}
              title="No documents published"
              description="Notes, slides and question papers added for this course appear here."
            />
          ) : (
            <Panel>
              <SectionHeader
                eyebrow="Course material"
                title={`${courseDocuments.length} documents`}
                description="Open any item in the inline viewer, or bookmark it for revision."
              />
              <div className="mt-5 space-y-2.5">
                {courseDocuments.map((document) => (
                  <DocumentRow
                    key={document.id}
                    document={document}
                    bookmarked={state.bookmarkedDocuments.includes(document.id)}
                    onBookmark={() => toggleDocumentBookmark(document.id)}
                  />
                ))}
              </div>
            </Panel>
          )}

          {courseBooks.length > 0 ? (
            <Panel>
              <SectionHeader
                eyebrow="Reading"
                title="Books linked to this course"
                description="Used copies listed by other students on campus."
                action={
                  <Link to="/books" className="text-xs font-medium text-accent hover:text-accent-hover">
                    Browse the shelf
                  </Link>
                }
              />
              <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {courseBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </Panel>
          ) : (
            <Panel strength="quiet">
              <p className="flex items-start gap-2.5 text-xs leading-relaxed text-fg-muted">
                <BookOpen className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                No book listings are linked to {course.code} yet. If you are selling the recommended text, listing it
                with this course code makes it far easier for the next batch to find.
              </p>
            </Panel>
          )}
        </div>
      ) : null}

      {tab === 'notices' ? (
        courseNotices.length === 0 ? (
          <EmptyState
            title="No announcements for this course"
            description="Course announcements appear here as soon as the faculty member publishes one."
          />
        ) : (
          <div className="space-y-3">
            {courseNotices.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} isRead={state.readNotices.includes(notice.id)} />
            ))}
          </div>
        )
      ) : null}

      <Panel strength="quiet">
        <p className="flex flex-wrap items-center gap-3 text-xs text-fg-muted">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-fg-subtle" aria-hidden="true" />
            Sessions shown in local time
          </span>
          <span className="flex items-center gap-1.5">
            <GraduationCap className="size-3.5 text-fg-subtle" aria-hidden="true" />
            Semester {course.semester}
          </span>
          <span>Last checked {formatDate(new Date(), 'short')} at {formatTime(new Date().toTimeString().slice(0, 5))}</span>
          <span className="text-fg-subtle">
            {COURSES.length} courses in your registration · demonstration data
          </span>
        </p>
      </Panel>
    </div>
  );
}
