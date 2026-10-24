import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Megaphone, Pin } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { COURSES } from '@/data/academics';
import { formatDate, relativeTime } from '@/lib/format';
import {
  Badge,
  Button,
  DataOriginTag,
  EmptyState,
  Panel,
  SectionHeader,
  StatTile,
  type Tone,
} from '@/components/ui/primitives';
import { FilterPill, SearchField, Select } from '@/components/ui/fields';
import { Tabs } from '@/components/ui/overlays';
import { ModuleHero, SaveButton } from '@/features/shared';
import { CourseChip, IMPORTANCE_LABEL, IMPORTANCE_TONE } from './components';
import type { NoticeImportance } from '@/lib/types';

const SCOPE_LABELS: Record<string, string> = {
  university: 'Institution',
  department: 'Department',
  course: 'Course',
  community: 'Community',
};

const SCOPE_TONE: Record<string, Tone> = {
  university: 'accent',
  department: 'teal',
  course: 'warn',
  community: 'muted',
};

export default function NoticesPage() {
  const { notices, state, markNoticeRead, markAllNoticesRead, profile } = useApp();
  const [view, setView] = useState<'all' | 'unread' | 'pinned' | 'critical'>('all');
  const [scope, setScope] = useState<string | null>(null);
  const [importance, setImportance] = useState<NoticeImportance | 'any'>('any');
  const [course, setCourse] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('any');
  const [query, setQuery] = useState('');

  const categories = useMemo(
    () => Array.from(new Set(notices.map((notice) => notice.category))).sort(),
    [notices],
  );

  const relevant = useMemo(() => {
    // Students see institution, department, their courses and the community feed.
    const myCourses = COURSES.map((entry) => entry.code);
    return notices.filter((notice) => {
      if (notice.scope === 'course' && notice.courseCode && !myCourses.includes(notice.courseCode)) return false;
      return true;
    });
  }, [notices]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return relevant
      .filter((notice) => {
        const read = state.readNotices.includes(notice.id);
        if (view === 'unread' && read) return false;
        if (view === 'pinned' && !notice.pinned) return false;
        if (view === 'critical' && notice.importance !== 'critical') return false;
        if (scope && notice.scope !== scope) return false;
        if (importance !== 'any' && notice.importance !== importance) return false;
        if (course && notice.courseCode !== course) return false;
        if (category !== 'any' && notice.category !== category) return false;
        if (needle.length > 0) {
          const haystack = `${notice.title} ${notice.body} ${notice.channel} ${notice.department} ${notice.category}`.toLowerCase();
          if (!haystack.includes(needle)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const pinnedDelta = Number(b.pinned) - Number(a.pinned);
        if (pinnedDelta !== 0) return pinnedDelta;
        const importanceRank = { critical: 2, high: 1, normal: 0 };
        const rankDelta = importanceRank[b.importance] - importanceRank[a.importance];
        if (rankDelta !== 0) return rankDelta;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
  }, [relevant, view, scope, importance, course, category, query, state.readNotices]);

  const unreadCount = relevant.filter((notice) => !state.readNotices.includes(notice.id)).length;
  const pinnedCount = relevant.filter((notice) => notice.pinned).length;
  const criticalCount = relevant.filter((notice) => notice.importance === 'critical').length;

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Academic hub"
        title="Notice centre"
        description="Institution, department, course and community announcements in one searchable feed — with the channel and author attached to every item, instead of a forwarded screenshot."
        meta={
          <>
            <Badge tone={unreadCount > 0 ? 'accent' : 'ok'}>{unreadCount} unread</Badge>
            <Badge tone="warn">{pinnedCount} pinned</Badge>
            <Badge tone="danger">{criticalCount} critical</Badge>
            <DataOriginTag origin="demo" />
          </>
        }
        actions={
          <>
            <Button variant="secondary" icon={<CheckCheck className="size-4" />} onClick={markAllNoticesRead} disabled={unreadCount === 0}>
              Mark all read
            </Button>
            {profile.role !== 'student' ? (
              <Link
                to="/academics/manage/notice"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
              >
                <Megaphone className="size-4" aria-hidden="true" />
                Publish
              </Link>
            ) : null}
          </>
        }
        aside={
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="In feed" value={relevant.length} hint="Relevant to you" />
            <StatTile label="Unread" value={unreadCount} hint="Not yet opened" tone={unreadCount > 0 ? 'accent' : 'neutral'} />
            <StatTile label="Channels" value={new Set(relevant.map((n) => n.channel)).size} hint="Distinct publishers" />
            <StatTile label="Categories" value={categories.length} hint="From examinations to campus" />
          </div>
        }
      />

      <Panel strength="quiet">
        <p className="flex items-start gap-2.5 text-xs leading-relaxed text-fg-muted">
          <Bell className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
          <span>
            <span className="block font-medium text-fg">Where these come from</span>
            CampusOS never reads private messaging groups and never claims an integration it does not have. Notices
            arrive through authorised publishing in this app, manual submission by an administrator, or an imported
            document. Items authored by the community channel are labelled as such.
          </span>
        </p>
      </Panel>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            ariaLabel="Notice filters"
            variant="segmented"
            value={view}
            onChange={setView}
            tabs={[
              { value: 'all', label: 'All', count: relevant.length },
              { value: 'unread', label: 'Unread', count: unreadCount },
              { value: 'pinned', label: 'Pinned', count: pinnedCount },
              { value: 'critical', label: 'Critical', count: criticalCount },
            ]}
          />
          <div className="w-full max-w-sm">
            <SearchField value={query} onChange={setQuery} size="sm" placeholder="Search notices" label="Search notices" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterPill active={scope === null} onClick={() => setScope(null)}>
            Every scope
          </FilterPill>
          {Object.entries(SCOPE_LABELS).map(([value, label]) => {
            const count = relevant.filter((notice) => notice.scope === value).length;
            if (count === 0) return null;
            return (
              <FilterPill key={value} active={scope === value} onClick={() => setScope(value)} count={count}>
                {label}
              </FilterPill>
            );
          })}
          <span className="mx-1 hidden h-4 w-px bg-line-strong sm:block" aria-hidden="true" />
          {COURSES.slice(0, 4).map((entry) => {
            const count = relevant.filter((notice) => notice.courseCode === entry.code).length;
            if (count === 0) return null;
            return (
              <FilterPill key={entry.code} active={course === entry.code} onClick={() => setCourse(course === entry.code ? null : entry.code)} count={count}>
                {entry.code}
              </FilterPill>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            aria-label="Filter by importance"
            value={importance}
            onChange={(event) => setImportance(event.target.value as NoticeImportance | 'any')}
          >
            <option value="any">Any importance</option>
            <option value="critical">Critical</option>
            <option value="high">Important</option>
            <option value="normal">General</option>
          </Select>
          <Select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="any">All categories</option>
            {categories.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </Select>
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setScope(null);
                setCourse(null);
                setCategory('any');
                setImportance('any');
                setQuery('');
                setView('all');
              }}
            >
              Reset filters
            </Button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Pin className="size-5" aria-hidden="true" />}
          title="Nothing matches those filters"
          description="Try the All tab, clear the category filter, or search for a shorter term such as “examination”."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setView('all');
                setScope(null);
                setCourse(null);
                setCategory('any');
                setImportance('any');
                setQuery('');
              }}
            >
              Show every notice
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((notice) => {
            const read = state.readNotices.includes(notice.id);
            return (
              <article
                key={notice.id}
                className={`group relative rounded-2xl border p-4 transition-colors ${
                  read ? 'border-line bg-surface/30' : 'border-line bg-surface/55'
                }`}
              >
                {!read ? (
                  <span className="absolute left-0 top-6 h-8 w-[2px] rounded-r-full bg-accent" aria-hidden="true" />
                ) : null}
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={IMPORTANCE_TONE[notice.importance]}>{IMPORTANCE_LABEL[notice.importance]}</Badge>
                  <Badge tone={SCOPE_TONE[notice.scope]}>{SCOPE_LABELS[notice.scope]}</Badge>
                  {notice.pinned ? (
                    <Badge tone="accent" icon={<Pin className="size-3" aria-hidden="true" />}>
                      Pinned
                    </Badge>
                  ) : null}
                  <Badge tone="muted">{notice.category}</Badge>
                  {notice.courseCode ? <CourseChip code={notice.courseCode} /> : null}
                  {!read ? <Badge tone="teal">New</Badge> : null}
                </div>

                <Link
                  to={`/academics/notices/${notice.id}`}
                  onClick={() => markNoticeRead(notice.id)}
                  className="mt-3 block"
                >
                  <h3 className="text-[0.9375rem] font-medium leading-snug text-fg transition-colors group-hover:text-accent">
                    {notice.title}
                  </h3>
                </Link>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-fg-muted">{notice.body}</p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.6875rem] text-fg-subtle">
                    <span className="font-medium text-fg-muted">{notice.channel}</span>
                    <span>{notice.author}</span>
                    <span>{notice.department}</span>
                    <span>
                      {formatDate(notice.publishedAt, 'short')} · {relativeTime(notice.publishedAt)}
                    </span>
                    <DataOriginTag origin={notice.origin} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <SaveButton
                      kind="notice"
                      refId={notice.id}
                      title={notice.title}
                      subtitle={notice.channel}
                      href={`/academics/notices/${notice.id}`}
                      size="sm"
                      variant="ghost"
                    />
                    <Link
                      to={`/academics/notices/${notice.id}`}
                      onClick={() => markNoticeRead(notice.id)}
                      className="inline-flex h-8 items-center rounded-lg border border-line px-3 text-xs text-fg transition-colors hover:border-line-strong"
                    >
                      Read
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Panel strength="quiet">
        <SectionHeader
          eyebrow="Channels"
          title="Who publishes what"
          description="Every notice carries its publisher, so you can weigh how authoritative it is."
        />
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from(new Set(relevant.map((notice) => notice.channel))).map((channel) => {
            const items = relevant.filter((notice) => notice.channel === channel);
            return (
              <li key={channel} className="rounded-xl border border-line bg-surface/45 p-3.5">
                <p className="text-[0.8125rem] font-medium text-fg">{channel}</p>
                <p className="mt-1 text-[0.6875rem] text-fg-subtle">
                  {items.length} {items.length === 1 ? 'notice' : 'notices'} · {items[0]?.department}
                </p>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
