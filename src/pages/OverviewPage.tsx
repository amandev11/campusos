import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bell,
  BookOpen,
  CircleParking,
  ClipboardList,
  Eye,
  EyeOff,
  GraduationCap,
  MapPin,
  Settings2,
  Sparkles,
  TriangleAlert,
  Wallet,
} from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { useAuth } from '@/store/AuthProvider';
import {
  ACADEMIC_TERM,
  COURSES,
  EXAMS,
  clockNow,
  courseByCode,
  todaySessions,
  upcomingSessions,
} from '@/data/academics';
import { OPPORTUNITIES } from '@/data/opportunities';
import { PARKING_LOTS } from '@/data/parking';
import { PHOTO, photo } from '@/data/media';
import {
  deadlineLabel,
  formatDate,
  formatDayHeader,
  formatRange,
  formatTime,
  greetingFor,
  percent,
  relativeTime,
} from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  Badge,
  Button,
  DataOriginTag,
  EmptyState,
  Meter,
  Panel,
  SectionHeader,
  StatTile,
} from '@/components/ui/primitives';
import { SearchField } from '@/components/ui/fields';
import { Modal } from '@/components/ui/overlays';
import { SmartImage } from '@/components/ui/SmartImage';
import { BookCard } from '@/features/books/components';
import { OpportunityCard, STAGE_LABELS } from '@/features/opportunities/components';
import { DocumentRow, NoticeCard, SessionRow } from '@/features/academics/components';
import { AvailabilityFigure } from '@/features/parking/components';
import { ModuleHero } from '@/features/shared';
import { useMinuteClock } from '@/hooks';
import type { Notice, Opportunity } from '@/lib/types';

export default function OverviewPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { state, books, notices, assignments, documents, toggleDocumentBookmark, toggleSection, moveSection } =
    useApp();
  const [query, setQuery] = useState('');
  const [personalising, setPersonalising] = useState(false);
  const now = useMinuteClock();

  const myCourseCodes = useMemo(() => COURSES.map((course) => course.code), []);
  const sessions = useMemo(() => todaySessions(now), [now]);
  const nextSessions = useMemo(() => upcomingSessions(now, 3), [now]);

  const featuredNotice = useMemo(
    () =>
      notices.find((notice) => notice.pinned && notice.importance === 'critical') ??
      notices.find((notice) => notice.pinned) ??
      notices[0],
    [notices],
  );

  const deadlines = useMemo(() => {
    const nowTime = now.getTime();
    return assignments
      .filter((assignment) => !state.submissions[assignment.id])
      .filter((assignment) => new Date(assignment.dueAt).getTime() > nowTime - 86400000 * 2)
      .map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        courseCode: assignment.courseCode,
        at: assignment.dueAt,
        href: `/academics/assignments/${assignment.id}`,
      }))
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
      .slice(0, 5);
  }, [assignments, state.submissions, now]);

  const upcomingExams = useMemo(
    () =>
      EXAMS.filter((exam) => new Date(exam.date).getTime() > now.getTime())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3),
    [now],
  );

  const recommendedBooks = useMemo(() => {
    const mine = books.filter((book) => book.courseCodes.some((code) => myCourseCodes.includes(code)));
    const pool = mine.length >= 4 ? mine : [...mine, ...books];
    const seen = new Set<string>();
    return pool
      .filter((book) => book.status === 'active' && book.transaction !== 'borrow')
      .filter((book) => (seen.has(book.id) ? false : (seen.add(book.id), true)))
      .slice(0, 4);
  }, [books, myCourseCodes]);

  const recommendedOpportunities = useMemo(() => {
    const interests = profile?.interests ?? [];
    return OPPORTUNITIES.map((opportunity) => ({
      opportunity,
      matches: interests.filter(
        (interest) =>
          opportunity.categories.some((category) => category.toLowerCase().includes(interest.toLowerCase())) ||
          opportunity.tags.some((tag) => tag.toLowerCase().includes(interest.toLowerCase())),
      ).length,
    }))
      .sort(
        (a, b) =>
          b.matches - a.matches ||
          new Date(a.opportunity.deadline).getTime() - new Date(b.opportunity.deadline).getTime(),
      )
      .slice(0, 3);
  }, [profile?.interests]);

  const upcomingReservation = useMemo(
    () =>
      state.reservations
        .filter((reservation) => reservation.status === 'confirmed')
        .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`))[0],
    [state.reservations],
  );

  const attendanceRisk = useMemo(
    () =>
      COURSES.map((course) => ({ course, value: percent(course.attendanceAttended, course.attendanceHeld) }))
        .filter((entry) => entry.value < 80)
        .sort((a, b) => a.value - b.value),
    [],
  );

  const openAssignments = assignments.filter((assignment) => !state.submissions[assignment.id]).length;
  const unreadNotices = notices.filter((notice) => !state.readNotices.includes(notice.id)).length;

  const sections: Record<string, { span: string; node: ReactNode }> = {
    agenda: {
      span: 'col-span-12 xl:col-span-7',
      node: (
        <Panel>
          <SectionHeader
            eyebrow="Today"
            title={sessions.length > 0 ? 'Your teaching day' : 'No classes scheduled'}
            description={
              sessions.length > 0
                ? `${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'} across ${
                    new Set(sessions.map((session) => session.courseCode)).size
                  } courses.`
                : 'A clear day. The next sessions in your timetable are listed below.'
            }
            action={
              <Link
                to="/academics/timetable"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent-hover"
              >
                Full timetable
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            }
          />
          <div className="mt-5 space-y-2.5">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  isNow={session.start <= clockNow(now) && session.end > clockNow(now)}
                />
              ))
            ) : (
              <>
                {nextSessions.map(({ session, offsetDays }) => (
                  <SessionRow key={session.id} session={session} offsetDays={offsetDays} showDay />
                ))}
              </>
            )}
          </div>

          {attendanceRisk.length > 0 ? (
            <div className="mt-5 rounded-xl border border-warn/35 bg-warn-soft p-3.5">
              <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-warn">
                <TriangleAlert className="size-4" aria-hidden="true" />
                Attendance below 80% in {attendanceRisk.length}{' '}
                {attendanceRisk.length === 1 ? 'course' : 'courses'}
              </p>
              <div className="mt-3 space-y-2.5">
                {attendanceRisk.slice(0, 3).map(({ course, value }) => (
                  <div key={course.code}>
                    <div className="flex items-baseline justify-between gap-3 text-xs">
                      <Link to={`/academics/courses/${course.code}`} className="text-fg hover:text-accent">
                        {course.code} · {course.title}
                      </Link>
                      <span className={cn('numeric', value < 75 ? 'text-danger' : 'text-warn')}>{value}%</span>
                    </div>
                    <div className="mt-1.5">
                      <Meter
                        value={course.attendanceAttended}
                        max={course.attendanceHeld}
                        tone={value < 75 ? 'danger' : 'warn'}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/academics/attendance"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover"
              >
                Review attendance
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          ) : null}
        </Panel>
      ),
    },
    deadlines: {
      span: 'col-span-12 xl:col-span-5',
      node: (
        <Panel>
          <SectionHeader
            eyebrow="Next three weeks"
            title="Deadlines"
            description="Work you have not submitted, plus the examinations already scheduled."
            action={
              <Link to="/academics/assignments" className="text-xs font-medium text-accent hover:text-accent-hover">
                All work
              </Link>
            }
          />
          <div className="mt-5 space-y-2.5">
            {deadlines.length === 0 && upcomingExams.length === 0 ? (
              <EmptyState
                icon={<ClipboardList className="size-5" aria-hidden="true" />}
                title="No open deadlines"
                description="Nothing outstanding. New assignments and the examination schedule appear here."
                className="border-none py-6"
              />
            ) : (
              <>
                {deadlines.map((item) => {
                  const deadline = deadlineLabel(item.at, now);
                  const course = courseByCode(item.courseCode);
                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      className="group flex items-start gap-3 rounded-xl border border-line bg-surface/40 p-3 transition-colors hover:border-line-strong"
                    >
                      <span
                        className={cn(
                          'mt-1 size-2 shrink-0 rounded-full',
                          deadline.tone === 'danger' ? 'bg-danger' : deadline.tone === 'warn' ? 'bg-warn' : 'bg-fg-subtle',
                        )}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.8125rem] font-medium text-fg group-hover:text-accent">
                          {item.title}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.6875rem] text-fg-subtle">
                          <span className="numeric">{item.courseCode}</span>
                          <span className="truncate">{course?.title}</span>
                          <span
                            className={cn(
                              deadline.tone === 'danger' && 'text-danger',
                              deadline.tone === 'warn' && 'text-warn',
                            )}
                          >
                            {deadline.text}
                          </span>
                        </span>
                      </span>
                    </Link>
                  );
                })}
                {upcomingExams.length > 0 ? (
                  <>
                    <p className="caps pt-2">Examinations</p>
                    {upcomingExams.map((exam) => (
                      <Link
                        key={exam.id}
                        to="/academics/exams"
                        className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/40 p-3 transition-colors hover:border-line-strong"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[0.8125rem] font-medium text-fg group-hover:text-accent">
                            {courseByCode(exam.courseCode)?.title ?? exam.title}
                          </span>
                          <span className="mt-1 block text-[0.6875rem] text-fg-subtle">
                            {formatDate(exam.date, 'medium')} · {exam.start} · {exam.hall}
                          </span>
                        </span>
                        <Badge tone="accent">{exam.courseCode}</Badge>
                      </Link>
                    ))}
                  </>
                ) : null}
              </>
            )}
          </div>
        </Panel>
      ),
    },
    notices: {
      span: 'col-span-12 xl:col-span-7',
      node: (
        <Panel>
          <SectionHeader
            eyebrow="Academic hub"
            title="Notices that matter"
            description="Pinned and critical announcements from your institution, department and courses."
            action={
              <Link
                to="/academics/notices"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent-hover"
              >
                {unreadNotices > 0 ? `${unreadNotices} unread` : 'All notices'}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            }
          />
          <div className="mt-5 space-y-3">
            {notices.slice(0, 3).map((notice) => (
              <NoticeCard key={notice.id} notice={notice} isRead={state.readNotices.includes(notice.id)} />
            ))}
          </div>
        </Panel>
      ),
    },
    resources: {
      span: 'col-span-12 xl:col-span-5',
      node: (
        <Panel>
          <SectionHeader
            eyebrow="Document library"
            title="Recently added"
            description="Course material published by faculty and departments."
            action={
              <Link to="/academics/library" className="text-xs font-medium text-accent hover:text-accent-hover">
                Library
              </Link>
            }
          />
          <div className="mt-5 space-y-2.5">
            {documents.slice(0, 4).map((document) => (
              <DocumentRow
                key={document.id}
                document={document}
                bookmarked={state.bookmarkedDocuments.includes(document.id)}
                onBookmark={() => toggleDocumentBookmark(document.id)}
              />
            ))}
          </div>
        </Panel>
      ),
    },
    books: {
      span: 'col-span-12',
      node: (
        <Panel>
          <SectionHeader
            eyebrow="Books & resources"
            title="Matched to your courses"
            description="Used copies available on campus for the courses you are registered in. Listings are seller-supplied sample content."
            action={
              <Link
                to="/books"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent-hover"
              >
                Browse all books
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            }
          />
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {recommendedBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
          <p className="mt-4 text-[0.6875rem] text-fg-subtle">
            No payments are processed. Listings settle in person, as stated on each listing.
          </p>
        </Panel>
      ),
    },
    opportunities: {
      span: 'col-span-12 xl:col-span-7',
      node: (
        <Panel>
          <SectionHeader
            eyebrow="Travel & work"
            title="Worth a look"
            description="Ranked by how closely each listing matches the interests on your profile — a transparent rule-based match, not a model."
            action={
              <Link to="/opportunities" className="text-xs font-medium text-accent hover:text-accent-hover">
                Discover
              </Link>
            }
          />
          <div className="mt-5 space-y-4">
            {recommendedOpportunities.map(({ opportunity, matches }) => (
              <div key={opportunity.id}>
                <OpportunityCard
                  opportunity={opportunity}
                  layout="row"
                  stage={state.applications[opportunity.id]?.stage}
                />
                <p className="mt-1.5 pl-1 text-[0.6875rem] text-fg-subtle">
                  {matches > 0
                    ? `Matches ${matches} of the ${profile?.interests.length ?? 0} interests on your profile.`
                    : 'Newly listed — no interest match recorded.'}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      ),
    },
    parking: {
      span: 'col-span-12 xl:col-span-5',
      node: (
        <Panel>
          <SectionHeader
            eyebrow="Campus parking"
            title={upcomingReservation ? 'Your next reservation' : 'No reservation booked'}
            description={
              upcomingReservation
                ? 'Cancel at least an hour before the slot to release the bay.'
                : 'Reservations open 14 days ahead and need a valid vehicle permit.'
            }
            action={
              <Link to="/parking" className="text-xs font-medium text-accent hover:text-accent-hover">
                Availability
              </Link>
            }
          />
          <div className="mt-5 space-y-3">
            {upcomingReservation ? (
              <div className="rounded-xl border border-ok/30 bg-ok-soft p-3.5">
                <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-ok">
                  <CircleParking className="size-4" aria-hidden="true" />
                  {upcomingReservation.lotName}
                </p>
                <p className="numeric mt-2 text-[0.8125rem] text-fg">
                  {formatDate(upcomingReservation.date, 'medium')} · {formatTime(upcomingReservation.start)} –{' '}
                  {formatTime(upcomingReservation.end)}
                </p>
                <p className="mt-1 text-[0.6875rem] text-fg-subtle">
                  {upcomingReservation.zoneLabel} · {upcomingReservation.plate} · ref {upcomingReservation.reference}
                </p>
                <Link
                  to="/parking/bookings"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover"
                >
                  Manage booking
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            ) : null}
            <div className="space-y-3">
              {PARKING_LOTS.slice(0, 2).map((lot) => (
                <div key={lot.id}>
                  <AvailabilityFigure lot={lot} />
                  <Link
                    to={`/parking/${lot.id}`}
                    className="mt-1.5 inline-flex items-center gap-1.5 pl-1 text-[0.6875rem] text-fg-subtle transition-colors hover:text-accent"
                  >
                    <MapPin className="size-3" aria-hidden="true" />
                    {lot.name}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      ),
    },
    activity: {
      span: 'col-span-12 xl:col-span-7',
      node: (
        <Panel>
          <SectionHeader
            eyebrow="Across CampusOS"
            title="Recent activity"
            description="Everything you have done recently, whichever module it happened in."
          />
          {state.activity.length === 0 ? (
            <EmptyState
              icon={<Eye className="size-5" aria-hidden="true" />}
              title="Nothing here yet"
              description="Saving a book, applying to a role, submitting work or booking parking will all show up here."
              className="mt-5 border-none py-6"
            />
          ) : (
            <ol className="mt-5 space-y-1">
              {state.activity.slice(0, 6).map((entry) => {
                const content = (
                  <>
                    <span
                      className={cn(
                        'mt-1.5 size-1.5 shrink-0 rounded-full',
                        entry.tone === 'positive' ? 'bg-ok' : entry.tone === 'attention' ? 'bg-warn' : 'bg-fg-subtle',
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.8125rem] text-fg">{entry.label}</span>
                      <span className="mt-0.5 block truncate text-xs text-fg-muted">{entry.detail}</span>
                    </span>
                    <span className="shrink-0 text-[0.6875rem] text-fg-subtle">{relativeTime(entry.at, now)}</span>
                  </>
                );
                return (
                  <li key={entry.id}>
                    {entry.href ? (
                      <Link
                        to={entry.href}
                        className="flex gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface/50"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="flex gap-3 px-2 py-2.5">{content}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>
      ),
    },
    featured: { span: 'col-span-12', node: null },
  };

  const visibleSections = state.prefs.filter(
    (section) => section.visible && section.id !== 'featured' && sections[section.id],
  );
  const showFeatured = state.prefs.find((section) => section.id === 'featured')?.visible !== false && featuredNotice;

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow={`${formatDayHeader(now)} · ${ACADEMIC_TERM.name}`}
        title={`${greetingFor(now)}, ${profile?.name.split(' ')[0] ?? 'there'}.`}
        description={
          openAssignments > 0 || unreadNotices > 0
            ? `You have ${openAssignments} open ${openAssignments === 1 ? 'assignment' : 'assignments'} and ${
                unreadNotices === 1 ? 'one unread notice' : `${unreadNotices} unread notices`
              }. Everything below comes from your own account activity.`
            : 'No open assignments and no unread notices. A good moment to look at what else is on campus.'
        }
        meta={
          <>
            <Badge tone="teal">{ACADEMIC_TERM.department}</Badge>
            <Badge tone="muted">
              Week {ACADEMIC_TERM.weekNumber} of {ACADEMIC_TERM.totalWeeks}
            </Badge>
            <DataOriginTag origin="demo" />
          </>
        }
        actions={
          <>
            <Button variant="secondary" icon={<Sparkles className="size-4" />} onClick={() => setPersonalising(true)}>
              Personalise
            </Button>
            <Button variant="quiet" icon={<Bell className="size-4" />} onClick={() => navigate('/notifications')}>
              Notifications
            </Button>
          </>
        }
        aside={
          <div className="space-y-4">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Search everything on campus"
              label="Search from the dashboard"
              onSubmit={() => navigate(`/search?q=${encodeURIComponent(query)}`)}
              trailing={
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(query)}`)}
                >
                  Search
                </Button>
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                label="Open work"
                value={openAssignments}
                hint="Unsubmitted assignments"
                icon={<ClipboardList className="size-4" />}
              />
              <StatTile
                label="Saved"
                value={state.saved.length}
                hint="Across all modules"
                icon={<BookOpen className="size-4" />}
              />
              <StatTile
                label="Attendance"
                value={`${percent(
                  COURSES.reduce((sum, course) => sum + course.attendanceAttended, 0),
                  COURSES.reduce((sum, course) => sum + course.attendanceHeld, 0),
                )}%`}
                hint="Weighted across your courses"
                icon={<GraduationCap className="size-4" />}
              />
              <StatTile
                label="Applications"
                value={Object.keys(state.applications).length}
                hint={
                  state.applications['op-nimbus-intern']
                    ? `${STAGE_LABELS[state.applications['op-nimbus-intern']!.stage]} at Nimbus`
                    : 'Nothing tracked yet'
                }
                icon={<Wallet className="size-4" />}
              />
            </div>
          </div>
        }
      />

      {showFeatured ? (
        <FeaturedPanel
          notice={featuredNotice}
          opportunity={recommendedOpportunities[0]?.opportunity}
          now={now}
        />
      ) : null}

      <div className="grid grid-cols-12 gap-5">
        {visibleSections.map((section) => {
          const entry = sections[section.id];
          if (!entry?.node) return null;
          return (
            <div key={section.id} className={entry.span}>
              {entry.node}
            </div>
          );
        })}
      </div>

      <Panel strength="quiet" className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-fg">
            <EyeOff className="size-4 text-fg-subtle" aria-hidden="true" />
            Control what appears here
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            Hide sections you never use, or change their order. Your layout is stored on this device.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={<Settings2 className="size-4" />}
            onClick={() => setPersonalising(true)}
          >
            Personalise dashboard
          </Button>
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent-hover"
          >
            Account settings
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </Panel>

      <Modal
        open={personalising}
        onClose={() => setPersonalising(false)}
        title="Personalise your overview"
        description="Turn sections on or off and set their order. Changes apply immediately and are stored locally."
        size="md"
        footer={
          <Button variant="primary" onClick={() => setPersonalising(false)}>
            Done
          </Button>
        }
      >
        <ul className="space-y-2">
          {state.prefs.map((section, index) => (
            <li key={section.id} className="flex items-start gap-3 rounded-xl border border-line bg-surface/45 p-3.5">
              <button
                type="button"
                role="switch"
                aria-checked={section.visible}
                aria-label={`${section.visible ? 'Hide' : 'Show'} ${section.label}`}
                onClick={() => toggleSection(section.id)}
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                  section.visible ? 'border-accent bg-accent text-accent-ink' : 'border-line-strong text-transparent',
                )}
              >
                {section.visible ? <Eye className="size-3" aria-hidden="true" /> : null}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[0.8125rem] font-medium text-fg">{section.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-fg-subtle">{section.description}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => moveSection(section.id, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${section.label} up`}
                  className="rounded-md border border-line p-1 text-fg-subtle transition-colors hover:text-fg disabled:opacity-30"
                >
                  <ArrowUp className="size-3" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(section.id, 1)}
                  disabled={index === state.prefs.length - 1}
                  aria-label={`Move ${section.label} down`}
                  className="rounded-md border border-line p-1 text-fg-subtle transition-colors hover:text-fg disabled:opacity-30"
                >
                  <ArrowDown className="size-3" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}

function FeaturedPanel({
  notice,
  opportunity,
  now,
}: {
  notice: Notice | undefined;
  opportunity: Opportunity | undefined;
  now: Date;
}) {
  if (!notice) return null;
  return (
    <Panel strength="float" padded={false} className="sheen relative overflow-hidden">
      <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-6 lg:p-8">
          <p className="caps">Featured this week</p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Badge tone={notice.importance === 'critical' ? 'danger' : 'warn'}>
              {notice.importance === 'critical' ? 'Critical' : 'Important'}
            </Badge>
            <Badge tone="muted">{notice.channel}</Badge>
            {notice.courseCode ? <Badge tone="accent">{notice.courseCode}</Badge> : null}
          </div>
          <h2 className="display mt-4 text-[1.75rem] leading-tight text-fg sm:text-[2.125rem]">{notice.title}</h2>
          <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-fg-muted">
            {notice.body.slice(0, 260)}
            {notice.body.length > 260 ? '…' : ''}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to={`/academics/notices/${notice.id}`}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
            >
              Read the full notice
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            {opportunity ? (
              <Link
                to={`/opportunities/${opportunity.id}`}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm text-fg transition-colors hover:border-line-strong"
              >
                {formatRange(
                  opportunity.compensation.min,
                  opportunity.compensation.max,
                  opportunity.compensation.currency,
                  opportunity.compensation.period,
                )}{' '}
                · {opportunity.country}
              </Link>
            ) : null}
          </div>
          <p className="mt-4 text-[0.6875rem] text-fg-subtle">
            Published {relativeTime(notice.publishedAt, now)} by {notice.author}
          </p>
        </div>
        <div className="relative min-h-56 lg:min-h-full">
          <SmartImage
            src={photo(PHOTO.campus, { w: 1000, h: 800 })}
            alt="Campus buildings seen from the quadrangle"
            wrapperClassName="absolute inset-0 h-full"
            sizes="(max-width: 1024px) 100vw, 520px"
            priority
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/25 to-transparent lg:bg-gradient-to-r lg:from-canvas lg:via-canvas/10 lg:to-transparent"
            aria-hidden="true"
          />
          <p className="caps absolute bottom-4 left-4 right-4 lg:hidden">Meridian Institute of Technology</p>
        </div>
      </div>
    </Panel>
  );
}
