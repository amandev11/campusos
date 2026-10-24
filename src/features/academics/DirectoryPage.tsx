import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building, Clock, Mail, MapPin, Users } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { FACULTY, COURSES } from '@/data/academics';
import {
  Avatar,
  Badge,
  EmptyState,
  Panel,
  SectionHeader,
  StatTile,
} from '@/components/ui/primitives';
import { FilterPill, SearchField } from '@/components/ui/fields';
import { ModuleHero } from '@/features/shared';
import { CourseChip } from './components';

export default function DirectoryPage() {
  const { notices } = useApp();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [department, setDepartment] = useState<string | null>(null);

  const departments = useMemo(
    () => Array.from(new Set(FACULTY.map((member) => member.department))).sort(),
    [],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return FACULTY.filter((member) => {
      if (department && member.department !== department) return false;
      if (needle.length > 0) {
        const haystack = `${member.name} ${member.title} ${member.department} ${member.researchAreas.join(' ')} ${member.email} ${member.courses.join(' ')}`.toLowerCase();
        if (!needle.split(/\s+/).every((term) => haystack.includes(term))) return false;
      }
      return true;
    });
  }, [query, department]);

  const noticeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const notice of notices) {
      counts.set(notice.author, (counts.get(notice.author) ?? 0) + 1);
    }
    return counts;
  }, [notices]);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Academic hub"
        title="Faculty & department directory"
        description="Who teaches what, where their cabin is, and when they hold office hours — so you do not have to find out through a forwarded message."
        meta={
          <>
            <Badge tone="accent">{FACULTY.length} people</Badge>
            <Badge tone="teal">{departments.length} departments</Badge>
            <Badge tone="muted">{COURSES.length} courses covered</Badge>
          </>
        }
        aside={
          <div className="space-y-3">
            <SearchField
              value={query}
              onChange={setQuery}
              size="lg"
              placeholder="Name, subject or research area"
              label="Search the directory"
            />
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Teaching staff" value={FACULTY.filter((m) => m.courses.length > 0).length} hint="With courses this term" />
              <StatTile label="Support offices" value={FACULTY.filter((m) => m.courses.length === 0).length} hint="Welfare and administration" />
            </div>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <FilterPill active={department === null} onClick={() => setDepartment(null)}>
          Every department
        </FilterPill>
        {departments.map((entry) => (
          <FilterPill
            key={entry}
            active={department === entry}
            onClick={() => setDepartment(department === entry ? null : entry)}
            count={FACULTY.filter((member) => member.department === entry).length}
          >
            {entry}
          </FilterPill>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" aria-hidden="true" />}
          title="No one matches that search"
          description="Try a surname, a course code such as CS301, or a research area like “graph theory”."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((member) => (
            <Panel key={member.id} className="flex flex-col">
              <div className="flex items-start gap-3.5">
                <Avatar name={member.name} seed={member.avatarSeed} size="lg" />
                <div className="min-w-0">
                  <h3 className="text-[0.9375rem] font-medium text-fg">{member.name}</h3>
                  <p className="mt-0.5 text-xs text-fg-muted">{member.title}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[0.6875rem] text-fg-subtle">
                    <Building className="size-3" aria-hidden="true" />
                    {member.department}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs text-fg-muted">
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
                  {member.cabin}
                </p>
                <p className="flex items-start gap-2">
                  <Clock className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
                  {member.hours}
                </p>
                <p className="flex items-start gap-2">
                  <Mail className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
                  <a
                    href={`mailto:${member.email}`}
                    className="truncate text-accent transition-colors hover:text-accent-hover"
                  >
                    {member.email}
                  </a>
                </p>
              </div>

              {member.courses.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {member.courses.map((code) => (
                    <CourseChip key={code} code={code} />
                  ))}
                </div>
              ) : null}

              {member.researchAreas.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {member.researchAreas.map((area) => (
                    <Badge key={area} tone="muted">
                      {area}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {noticeCounts.get(member.name) ? (
                <p className="mt-4 text-[0.6875rem] text-fg-subtle">
                  {noticeCounts.get(member.name)} notice{noticeCounts.get(member.name) === 1 ? '' : 's'} published
                </p>
              ) : null}

              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                {member.courses[0] ? (
                  <Link
                    to={`/academics/courses/${member.courses[0]}`}
                    className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-xs text-fg transition-colors hover:border-line-strong"
                  >
                    Course material
                  </Link>
                ) : null}
                <a
                  href={`mailto:${member.email}`}
                  className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-xs text-fg transition-colors hover:border-line-strong"
                >
                  Email
                </a>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Panel strength="quiet">
        <SectionHeader
          eyebrow="Contact expectations"
          title="How to approach faculty"
          description="A little etiquette saves everyone a week."
        />
        <ul className="mt-4 grid gap-4 sm:grid-cols-3 text-xs leading-relaxed text-fg-muted">
          <li>
            <span className="block font-medium text-fg">Office hours first</span>
            Drop in during the listed hours rather than after a lecture. Bring specific questions.
          </li>
          <li>
            <span className="block font-medium text-fg">Course channel for class matters</span>
            Timetable changes and deadlines belong in the course notice channel where everyone sees the answer.
          </li>
          <li>
            <span className="block font-medium text-fg">Directory details are sample data</span>
            Cabin numbers, hours and addresses here are demonstration content. Confirm against the official
            departmental listing.
          </li>
        </ul>
      </Panel>
    </div>
  );
}
