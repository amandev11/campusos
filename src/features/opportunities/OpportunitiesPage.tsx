import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Compass, ShieldAlert, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import {
  COUNTRIES,
  OPPORTUNITIES,
  OPPORTUNITY_EDITORIAL,
  OPPORTUNITY_TYPES,
  TYPE_LABELS,
} from '@/data/opportunities';
import { deadlineLabel, formatDurationWeeks, formatRange } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Badge, Button, EmptyState, Panel, StatTile } from '@/components/ui/primitives';
import { Checkbox, Field, FilterPill, SearchField, Select } from '@/components/ui/fields';
import { Modal } from '@/components/ui/overlays';
import { SmartImage } from '@/components/ui/SmartImage';
import { IntegrationNotice, ModuleHero } from '@/features/shared';
import { OpportunityCard } from './components';
import type { Opportunity, OpportunityType } from '@/lib/types';

interface Filters {
  query: string;
  types: OpportunityType[];
  countries: string[];
  remoteOnly: boolean;
  paidOnly: boolean;
  housingOnly: boolean;
  maxWeeks: number;
  experience: 'any' | Opportunity['experience'];
  sort: 'deadline' | 'recent' | 'pay';
}

const EMPTY: Filters = {
  query: '',
  types: [],
  countries: [],
  remoteOnly: false,
  paidOnly: false,
  housingOnly: false,
  maxWeeks: 60,
  experience: 'any',
  sort: 'deadline',
};

export default function OpportunitiesPage() {
  const { state, isSaved } = useApp();
  const [params] = useSearchParams();
  const [filters, setFilters] = useState<Filters>({
    ...EMPTY,
    query: params.get('q') ?? '',
    types: params.get('type') ? [params.get('type') as OpportunityType] : [],
    remoteOnly: params.get('remote') === 'true',
  });
  const [panelOpen, setPanelOpen] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = filters.query.trim().toLowerCase();
    const result = OPPORTUNITIES.filter((opportunity) => {
      if (filters.types.length > 0 && !filters.types.includes(opportunity.type)) return false;
      if (filters.countries.length > 0 && !filters.countries.includes(opportunity.country)) return false;
      if (filters.remoteOnly && !opportunity.remote) return false;
      if (filters.paidOnly && opportunity.compensation.max === 0) return false;
      if (filters.housingOnly && !opportunity.accommodation) return false;
      if (opportunity.durationWeeks > filters.maxWeeks) return false;
      if (filters.experience !== 'any' && opportunity.experience !== filters.experience) return false;
      if (needle.length > 0) {
        const haystack = `${opportunity.title} ${opportunity.organisation} ${opportunity.location} ${opportunity.country} ${opportunity.categories.join(' ')} ${opportunity.tags.join(' ')} ${opportunity.description}`.toLowerCase();
        if (!needle.split(/\s+/).every((term) => haystack.includes(term))) return false;
      }
      return true;
    });

    const sorted = [...result];
    switch (filters.sort) {
      case 'recent':
        sorted.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
        break;
      case 'pay':
        sorted.sort((a, b) => b.compensation.max - a.compensation.max);
        break;
      default:
        sorted.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    }
    return sorted;
  }, [filters]);

  const activeCount =
    filters.types.length +
    filters.countries.length +
    (filters.remoteOnly ? 1 : 0) +
    (filters.paidOnly ? 1 : 0) +
    (filters.housingOnly ? 1 : 0) +
    (filters.experience !== 'any' ? 1 : 0) +
    (filters.maxWeeks < 60 ? 1 : 0);

  function toggleType(type: OpportunityType) {
    setFilters((current) => ({
      ...current,
      types: current.types.includes(type) ? current.types.filter((entry) => entry !== type) : [...current.types, type],
    }));
  }

  function toggleCountry(country: string) {
    setFilters((current) => ({
      ...current,
      countries: current.countries.includes(country)
        ? current.countries.filter((entry) => entry !== country)
        : [...current.countries, country],
    }));
  }

  const panel = (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.8125rem] font-medium text-fg">Filters</p>
        {activeCount > 0 ? (
          <button type="button" onClick={() => setFilters({ ...EMPTY })} className="text-xs text-accent hover:text-accent-hover">
            Clear all ({activeCount})
          </button>
        ) : null}
      </div>

      <Field label="Opportunity type">
        <div className="flex flex-wrap gap-1.5">
          {OPPORTUNITY_TYPES.map((type) => (
            <FilterPill key={type.value} active={filters.types.includes(type.value)} onClick={() => toggleType(type.value)}>
              {type.label}
            </FilterPill>
          ))}
        </div>
      </Field>

      <Field label="Country">
        <div className="flex flex-wrap gap-1.5">
          {COUNTRIES.map((country) => (
            <FilterPill key={country} active={filters.countries.includes(country)} onClick={() => toggleCountry(country)}>
              {country}
            </FilterPill>
          ))}
        </div>
      </Field>

      <Field label="Arrangement">
        <div className="space-y-2.5">
          <Checkbox
            checked={filters.remoteOnly}
            onChange={(checked) => setFilters((current) => ({ ...current, remoteOnly: checked }))}
            label="Remote only"
            hint="Work you can do from campus."
          />
          <Checkbox
            checked={filters.paidOnly}
            onChange={(checked) => setFilters((current) => ({ ...current, paidOnly: checked }))}
            label="Paid roles only"
            hint="Hides unpaid and work-exchange listings."
          />
          <Checkbox
            checked={filters.housingOnly}
            onChange={(checked) => setFilters((current) => ({ ...current, housingOnly: checked }))}
            label="Accommodation provided"
            hint="The organiser states that board is included."
          />
        </div>
      </Field>

      <Field label={`Duration up to ${formatDurationWeeks(filters.maxWeeks)}`}>
        <input
          type="range"
          min={4}
          max={60}
          step={2}
          value={filters.maxWeeks}
          onChange={(event) => setFilters((current) => ({ ...current, maxWeeks: Number(event.target.value) }))}
          className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-[var(--accent)]"
          aria-label="Maximum duration in weeks"
        />
      </Field>

      <Field label="Experience level">
        <Select
          value={filters.experience}
          onChange={(event) =>
            setFilters((current) => ({ ...current, experience: event.target.value as Filters['experience'] }))
          }
        >
          <option value="any">Any</option>
          <option value="none">No experience required</option>
          <option value="some">Some experience helpful</option>
          <option value="experienced">Experienced preferred</option>
        </Select>
      </Field>

      <Field label="Sort by">
        <Select
          value={filters.sort}
          onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as Filters['sort'] }))}
        >
          <option value="deadline">Closing soonest</option>
          <option value="recent">Most recently posted</option>
          <option value="pay">Highest stated pay</option>
        </Select>
      </Field>
    </div>
  );

  const tracked = Object.keys(state.applications).length;
  const compareItems = compare
    .map((id) => OPPORTUNITIES.find((opportunity) => opportunity.id === id))
    .filter(Boolean) as Opportunity[];

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Travel & work opportunities"
        title="Work, teach and travel — with the paperwork stated plainly"
        description="Internships, seasonal roles, teaching posts, outdoor work and travel programmes. Every listing states its source, and verification badges appear only when a source supplies verification."
        tone="teal"
        meta={
          <>
            <Badge tone="teal">{OPPORTUNITIES.length} listings</Badge>
            <Badge tone="accent">{OPPORTUNITIES.filter((o) => o.remote).length} remote</Badge>
            <Badge tone="muted">{OPPORTUNITIES.filter((o) => o.accommodation).length} with housing</Badge>
          </>
        }
        actions={
          <>
            <Link
              to="/opportunities/tracker"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm text-fg transition-colors hover:border-line-strong"
            >
              Application tracker
            </Link>
            <Button
              variant="primary"
              icon={<Sparkles className="size-4" />}
              onClick={() => {
                setFilters((current) => ({ ...current, sort: 'deadline' }));
              }}
            >
              Closing soonest
            </Button>
          </>
        }
        aside={
          <div className="space-y-3">
            <SearchField
              value={filters.query}
              onChange={(value) => setFilters((current) => ({ ...current, query: value }))}
              size="lg"
              placeholder="Role, organisation, country or skill"
              label="Search opportunities"
            />
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Tracked" value={tracked} hint="In your tracker" />
              <StatTile
                label="Closing soon"
                value={OPPORTUNITIES.filter((o) => deadlineLabel(o.deadline).days <= 14).length}
                hint="Within a fortnight"
              />
            </div>
          </div>
        }
      />

      <IntegrationNotice integrationId="opportunities" />

      <div className="grid gap-4 lg:grid-cols-3">
        {OPPORTUNITY_EDITORIAL.map((entry) => (
          <Link key={entry.id} to={entry.href} className="group block">
            <Panel padded={false} className="overflow-hidden">
              <div className="relative">
                <SmartImage src={entry.image} alt="" ratio="16 / 10" sizes="(max-width: 1024px) 100vw, 380px" />
                <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/30 to-transparent" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="caps">{entry.eyebrow}</p>
                  <h3 className="display mt-1.5 text-[1.1875rem] leading-tight text-fg transition-colors group-hover:text-accent">
                    {entry.title}
                  </h3>
                </div>
              </div>
              <p className="p-4 pt-0 text-xs leading-relaxed text-fg-muted">{entry.description}</p>
            </Panel>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
        <aside className="hidden lg:block">
          <Panel className="sticky top-24">{panel}</Panel>
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="display text-[1.5rem] text-fg">
                {filters.query ? `Matching “${filters.query}”` : 'Open now'}
              </h2>
              <p className="mt-1 text-xs text-fg-muted">
                {filtered.length} {filtered.length === 1 ? 'listing' : 'listings'}
                {activeCount > 0 ? ` · ${activeCount} filters applied` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="lg:hidden"
                icon={<SlidersHorizontal className="size-4" />}
                onClick={() => setPanelOpen(true)}
              >
                Filters{activeCount > 0 ? ` (${activeCount})` : ''}
              </Button>
              {compare.length > 0 ? (
                <Button size="sm" variant="primary" onClick={() => setCompareOpen(true)}>
                  Compare ({compare.length})
                </Button>
              ) : null}
            </div>
          </div>

          {activeCount > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {filters.types.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-2.5 py-1 text-[0.6875rem] text-accent"
                >
                  {TYPE_LABELS[type]}
                  <X className="size-3" aria-hidden="true" />
                </button>
              ))}
              {filters.countries.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => toggleCountry(country)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-2.5 py-1 text-[0.6875rem] text-accent"
                >
                  {country}
                  <X className="size-3" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Compass className="size-5" aria-hidden="true" />}
              title="Nothing matches those filters"
              description="Try removing the country filter, widening the duration, or searching for a skill rather than a job title."
              action={
                <Button variant="secondary" onClick={() => setFilters({ ...EMPTY })}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((opportunity) => (
                <div key={opportunity.id} className="relative">
                  <OpportunityCard
                    opportunity={opportunity}
                    layout="row"
                    stage={state.applications[opportunity.id]?.stage}
                  />
                  <label className="absolute bottom-3 right-3 flex cursor-pointer items-center gap-1.5 text-[0.6875rem] text-fg-subtle">
                    <input
                      type="checkbox"
                      checked={compare.includes(opportunity.id)}
                      onChange={() =>
                        setCompare((current) =>
                          current.includes(opportunity.id)
                            ? current.filter((id) => id !== opportunity.id)
                            : current.length >= 3
                              ? current
                              : [...current, opportunity.id],
                        )
                      }
                      className="size-3.5 accent-[var(--accent)]"
                    />
                    Compare
                  </label>
                </div>
              ))}
            </div>
          )}

          <Panel strength="quiet">
            <p className="flex items-start gap-2.5 text-xs leading-relaxed text-fg-muted">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
              <span>
                <span className="block font-medium text-fg">Before you commit to anything</span>
                No employer, salary, visa outcome or placement is verified by CampusOS. Confirm the organisation
                independently, never pay a fee to be offered work, and share travel plans with someone you trust.
                Listings here are demonstration content until a verified feed is connected.
              </span>
            </p>
          </Panel>
        </div>
      </div>

      <Modal
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Filter opportunities"
        size="sm"
        footer={
          <Button variant="primary" onClick={() => setPanelOpen(false)}>
            Show {filtered.length} results
          </Button>
        }
      >
        {panel}
      </Modal>

      <Modal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        title="Compare opportunities"
        description="Up to three listings side by side. Everything here comes from the listing itself."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCompare([])}>
              Clear comparison
            </Button>
            <Button variant="primary" onClick={() => setCompareOpen(false)}>
              Close
            </Button>
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className="w-32 py-2 pr-3 align-bottom text-fg-subtle"> </th>
                {compareItems.map((opportunity) => (
                  <th key={opportunity.id} className="px-3 py-2 align-bottom">
                    <Link to={`/opportunities/${opportunity.id}`} className="text-[0.8125rem] font-medium text-fg hover:text-accent">
                      {opportunity.title}
                    </Link>
                    <p className="mt-0.5 text-[0.6875rem] font-normal text-fg-subtle">{opportunity.organisation}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {[
                { label: 'Type', render: (o: Opportunity) => TYPE_LABELS[o.type] },
                { label: 'Location', render: (o: Opportunity) => o.location },
                {
                  label: 'Pay',
                  render: (o: Opportunity) =>
                    formatRange(o.compensation.min, o.compensation.max, o.compensation.currency, o.compensation.period),
                },
                { label: 'Hours', render: (o: Opportunity) => `${o.hoursPerWeek} hrs/week` },
                { label: 'Duration', render: (o: Opportunity) => formatDurationWeeks(o.durationWeeks) },
                { label: 'Housing', render: (o: Opportunity) => o.accommodation ?? 'Not stated' },
                { label: 'Visa', render: (o: Opportunity) => o.visaSupport },
                { label: 'Closes', render: (o: Opportunity) => deadlineLabel(o.deadline).text },
                { label: 'Saved', render: (o: Opportunity) => (isSaved(o.id) ? 'Yes' : 'No') },
              ].map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="py-2.5 pr-3 align-top font-normal text-fg-subtle">
                    {row.label}
                  </th>
                  {compareItems.map((opportunity) => (
                    <td key={opportunity.id} className={cn('px-3 py-2.5 align-top text-fg-muted')}>
                      {row.render(opportunity)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
