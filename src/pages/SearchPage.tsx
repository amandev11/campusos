import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Sparkles } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import {
  SEARCH_KIND_LABELS,
  SEARCH_KIND_ORDER,
  buildIndex,
  searchAll,
} from '@/lib/search';
import { cn } from '@/lib/cn';
import { Badge, Button, EmptyState, Panel, SectionHeader } from '@/components/ui/primitives';
import { FilterPill, SearchField, Select } from '@/components/ui/fields';
import { Kbd } from '@/components/ui/primitives';
import { ModuleHero } from '@/features/shared';
import type { SearchKind } from '@/lib/types';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const { state, recordSearch, clearRecentSearches } = useApp();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [kinds, setKinds] = useState<SearchKind[]>([]);
  const [sort, setSort] = useState<'relevance' | 'title'>('relevance');

  const index = useMemo(() => buildIndex(), []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query.trim().length >= 2) recordSearch(query);
    }, 700);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const results = useMemo(
    () => searchAll(query, index, { kinds: kinds.length > 0 ? kinds : undefined, limit: 60 }),
    [query, index, kinds],
  );

  const ordered = useMemo(
    () => (sort === 'title' ? [...results].sort((a, b) => a.title.localeCompare(b.title)) : results),
    [results, sort],
  );

  const grouped = useMemo(() => {
    const map = new Map<SearchKind, typeof ordered>();
    for (const kind of SEARCH_KIND_ORDER) {
      const items = ordered.filter((result) => result.kind === kind);
      if (items.length > 0) map.set(kind, items);
    }
    return map;
  }, [ordered]);

  function submit(value: string) {
    setQuery(value);
    if (value.trim()) setParams({ q: value.trim() });
    else setParams({});
  }

  const kindCounts = useMemo(() => {
    const map = new Map<SearchKind, number>();
    for (const kind of SEARCH_KIND_ORDER) {
      const count = index.filter((entry) => entry.kind === kind).length;
      if (count > 0) map.set(kind, count);
    }
    return map;
  }, [index]);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Unified search"
        title={query ? `Results for “${query}”` : 'Search everything on campus'}
        description="Books, opportunities, notices, documents, assignments, courses, examinations and parking areas — searched together, ranked by how well each item matches."
        meta={
          <>
            <Badge tone="accent">{results.length} matches</Badge>
            <Badge tone="muted">{index.length} items indexed</Badge>
            <span className="inline-flex items-center gap-1.5 text-[0.6875rem] text-fg-subtle">
              Press <Kbd>⌘</Kbd>
              <Kbd>K</Kbd> anywhere for the command palette
            </span>
          </>
        }
        aside={
          <div className="space-y-3">
            <SearchField
              value={query}
              onChange={submit}
              size="lg"
              autoFocus={!query}
              placeholder="Try “algorithms”, “teaching abroad”, “North Deck”"
              label="Search everything"
            />
            {state.recentSearches.length > 0 ? (
              <div>
                <p className="caps mb-2">Recent searches</p>
                <div className="flex flex-wrap gap-1.5">
                  {state.recentSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => submit(term)}
                      className="rounded-full border border-line bg-surface/50 px-2.5 py-1 text-[0.6875rem] text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
                    >
                      {term}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="px-2 py-1 text-[0.6875rem] text-fg-subtle hover:text-fg"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterPill active={kinds.length === 0} onClick={() => setKinds([])} count={index.length}>
            Everything
          </FilterPill>
          {SEARCH_KIND_ORDER.map((kind) => (
            <FilterPill
              key={kind}
              active={kinds.includes(kind)}
              onClick={() =>
                setKinds((current) =>
                  current.includes(kind) ? current.filter((entry) => entry !== kind) : [...current, kind],
                )
              }
              count={kindCounts.get(kind) ?? 0}
            >
              {SEARCH_KIND_LABELS[kind]}
            </FilterPill>
          ))}
        </div>
        <Select
          aria-label="Sort results"
          value={sort}
          onChange={(event) => setSort(event.target.value as typeof sort)}
          className="h-9 w-44 text-xs"
        >
          <option value="relevance">Best match</option>
          <option value="title">Title A–Z</option>
        </Select>
      </div>

      {query.trim().length < 2 ? (
        <Panel>
          <SectionHeader
            eyebrow="Start here"
            title="Search across all four modules at once"
            description="Two characters is enough. Results are grouped by module so you can jump straight to the right place."
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Books & resources', example: 'CNC, ISBN or course code', href: '/books' },
              { label: 'Travel & work', example: '“TEFL”, “remote”, “Norway”', href: '/opportunities' },
              { label: 'Academic hub', example: '“datesheet”, “CS304 notes”', href: '/academics' },
              { label: 'Campus parking', example: '“North Deck”, “EV”, “visitor”', href: '/parking' },
            ].map((entry) => (
              <Link
                key={entry.label}
                to={entry.href}
                className="rounded-xl border border-line bg-surface/45 p-3.5 transition-colors hover:border-line-strong"
              >
                <p className="text-[0.8125rem] font-medium text-fg">{entry.label}</p>
                <p className="mt-1 text-[0.6875rem] text-fg-subtle">{entry.example}</p>
              </Link>
            ))}
          </div>
          {state.recentSearches.length === 0 ? (
            <p className="mt-5 flex items-center gap-2 text-xs text-fg-subtle">
              <Sparkles className="size-3.5 text-accent" aria-hidden="true" />
              Results are not personalised or generated — they come from a deterministic keyword index over the content
              in this workspace.
            </p>
          ) : null}
        </Panel>
      ) : results.length === 0 ? (
        <EmptyState
          icon={<Search className="size-5" aria-hidden="true" />}
          title={`Nothing matches “${query}”`}
          description="Search covers titles, authors, employers, notice text, course codes, tags and parking rules. Try a shorter word, or a course code such as CS301."
          action={
            <Button variant="secondary" onClick={() => submit('')}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {[...grouped.entries()].map(([kind, items]) => (
            <Panel key={kind}>
              <SectionHeader
                eyebrow={`${items.length} ${items.length === 1 ? 'result' : 'results'}`}
                title={SEARCH_KIND_LABELS[kind]}
              />
              <ul className="mt-5 space-y-2">
                {items.map((result) => (
                  <li key={result.id}>
                    <Link
                      to={result.href}
                      className="group flex items-start gap-3 rounded-xl border border-transparent px-2.5 py-2.5 transition-colors hover:border-line hover:bg-surface/50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[0.875rem] font-medium text-fg group-hover:text-accent">
                            {result.title}
                          </span>
                          {result.badge ? <Badge tone="accent">{result.badge}</Badge> : null}
                        </span>
                        <span className="mt-0.5 block text-xs text-fg-muted">{result.subtitle}</span>
                        <span className="mt-0.5 block text-[0.6875rem] text-fg-subtle">{result.meta}</span>
                      </span>
                      <span className={cn('numeric shrink-0 pt-1 text-[0.625rem] text-fg-subtle')}>
                        {Math.round(result.score)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
