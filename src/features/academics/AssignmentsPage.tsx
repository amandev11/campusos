import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardList, Plus } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { COURSES } from '@/data/academics';
import { deadlineLabel, formatDate, formatTime } from '@/lib/format';
import {
  Badge,
  Button,
  DataOriginTag,
  EmptyState,
  Panel,
  SectionHeader,
  StatTile,
} from '@/components/ui/primitives';
import { FilterPill, SearchField } from '@/components/ui/fields';
import { Tabs } from '@/components/ui/overlays';
import { ModuleHero } from '@/features/shared';
import { AssignmentRow } from './components';
import { useMinuteClock } from '@/hooks';

type View = 'open' | 'submitted' | 'graded' | 'late' | 'all';

export default function AssignmentsPage() {
  const { state, assignments, profile } = useApp();
  const now = useMinuteClock();
  const [view, setView] = useState<View>('open');
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState<string | null>(null);

  const enriched = useMemo(
    () =>
      assignments.map((assignment) => {
        const submission = state.submissions[assignment.id];
        const due = new Date(assignment.dueAt).getTime();
        return {
          assignment,
          submission,
          overdue: !submission && due < now.getTime(),
          late: Boolean(submission) && new Date(submission!.submittedAt).getTime() > due,
        };
      }),
    [assignments, state.submissions, now],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return enriched
      .filter((entry) => {
        if (course && entry.assignment.courseCode !== course) return false;
        if (needle.length > 0) {
          const haystack = `${entry.assignment.title} ${entry.assignment.brief} ${entry.assignment.courseCode} ${entry.assignment.createdBy}`.toLowerCase();
          if (!haystack.includes(needle)) return false;
        }
        switch (view) {
          case 'open':
            return !entry.submission;
          case 'submitted':
            return Boolean(entry.submission) && entry.submission!.marks == null;
          case 'graded':
            return entry.submission?.marks != null;
          case 'late':
            return entry.late || entry.overdue;
          default:
            return true;
        }
      })
      .sort((a, b) => new Date(a.assignment.dueAt).getTime() - new Date(b.assignment.dueAt).getTime());
  }, [enriched, view, query, course]);

  const counts = {
    open: enriched.filter((entry) => !entry.submission).length,
    submitted: enriched.filter((entry) => entry.submission && entry.submission.marks == null).length,
    graded: enriched.filter((entry) => entry.submission?.marks != null).length,
    late: enriched.filter((entry) => entry.late || entry.overdue).length,
  };

  const nextDue = enriched
    .filter((entry) => !entry.submission && new Date(entry.assignment.dueAt).getTime() > now.getTime())
    .sort((a, b) => new Date(a.assignment.dueAt).getTime() - new Date(b.assignment.dueAt).getTime())[0];

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Academic hub"
        title={profile.role === 'faculty' ? 'Coursework you set' : 'Assignments'}
        description={
          profile.role === 'faculty'
            ? 'Everything you have published, with the submissions attached to it. Grades entered here are stored locally, because no gradebook system is connected.'
            : 'Every piece of work across your courses, with submissions, marks and feedback in the same place.'
        }
        meta={
          <>
            <Badge tone={counts.open > 0 ? 'accent' : 'ok'}>{counts.open} open</Badge>
            <Badge tone="muted">{counts.submitted} awaiting marks</Badge>
            <Badge tone="teal">{counts.graded} graded</Badge>
            {counts.late > 0 ? <Badge tone="danger">{counts.late} late or overdue</Badge> : null}
            <DataOriginTag origin="demo" />
          </>
        }
        actions={
          profile.role !== 'student' ? (
            <Link
              to="/academics/manage/assignment"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
            >
              <Plus className="size-4" aria-hidden="true" />
              Create an assignment
            </Link>
          ) : null
        }
        aside={
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Total" value={assignments.length} hint="Across all courses" />
            <StatTile label="Courses" value={COURSES.length} hint="Registered this semester" />
            <StatTile
              label="Next due"
              value={nextDue ? deadlineLabel(nextDue.assignment.dueAt, now).text.replace('Due ', '') : '—'}
              hint={nextDue ? nextDue.assignment.title.slice(0, 40) : 'Nothing outstanding'}
              icon={<CalendarDays className="size-4" />}
            />
            <StatTile
              label="Marks available"
              value={assignments.reduce((sum, assignment) => sum + assignment.maxMarks, 0)}
              hint="Sum across all work"
            />
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          ariaLabel="Assignment filters"
          variant="segmented"
          value={view}
          onChange={setView}
          tabs={[
            { value: 'open', label: profile.role === 'faculty' ? 'Awaiting submissions' : 'To do', count: counts.open },
            { value: 'submitted', label: 'Submitted', count: counts.submitted },
            { value: 'graded', label: 'Graded', count: counts.graded },
            { value: 'late', label: 'Late', count: counts.late },
            { value: 'all', label: 'All', count: assignments.length },
          ]}
        />
        <div className="w-full max-w-xs">
          <SearchField
            value={query}
            onChange={setQuery}
            size="sm"
            placeholder="Search assignments"
            label="Search assignments"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterPill active={course === null} onClick={() => setCourse(null)} count={assignments.length}>
          All courses
        </FilterPill>
        {COURSES.map((entry) => {
          const count = enriched.filter((item) => item.assignment.courseCode === entry.code).length;
          if (count === 0) return null;
          return (
            <FilterPill key={entry.code} active={course === entry.code} onClick={() => setCourse(entry.code)} count={count}>
              {entry.code}
            </FilterPill>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-5" aria-hidden="true" />}
          title={view === 'open' ? 'Nothing outstanding' : 'Nothing in this view'}
          description={
            view === 'open'
              ? 'Every assignment across your courses has been submitted. New work appears here as soon as faculty publish it.'
              : 'Try another tab, clear the course filter, or search for a different term.'
          }
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setView('all');
                setCourse(null);
                setQuery('');
              }}
            >
              Show everything
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(({ assignment, submission, overdue, late }) => (
            <div key={assignment.id} className="relative">
              <AssignmentRow
                assignment={assignment}
                submitted={Boolean(submission)}
                marks={submission?.marks ?? null}
                marksMax={assignment.maxMarks}
              />
              {submission?.feedback ? (
                <p className="mt-1.5 rounded-lg border border-line bg-surface/45 p-3 text-xs leading-relaxed text-fg-muted">
                  <span className="font-medium text-fg">Feedback: </span>
                  {submission.feedback}
                </p>
              ) : null}
              {overdue || late ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-2 pl-1">
                  <Badge tone="danger">{overdue ? 'Overdue — not submitted' : 'Submitted after the deadline'}</Badge>
                  <span className="text-[0.6875rem] text-fg-subtle">
                    Due {formatDate(assignment.dueAt, 'medium')} at {formatTime(new Date(assignment.dueAt).toTimeString().slice(0, 5))}
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <Panel strength="quiet">
        <SectionHeader
          eyebrow="Deadlines and policy"
          title="What happens to late work"
          description="Late-submission policy is set by each department. This build does not enforce one."
        />
        <ul className="mt-4 grid gap-4 sm:grid-cols-3 text-xs leading-relaxed text-fg-muted">
          <li>
            <span className="block font-medium text-fg">Late penalties</span>
            Applied by the faculty member and recorded in their gradebook, not by CampusOS.
          </li>
          <li>
            <span className="block font-medium text-fg">Extensions</span>
            Request them directly from the course faculty. The request does not pass through this app.
          </li>
          <li>
            <span className="block font-medium text-fg">Marks shown here</span>
            Sample figures in demonstration mode. Consider the institute portal the record of truth.
          </li>
        </ul>
      </Panel>
    </div>
  );
}
