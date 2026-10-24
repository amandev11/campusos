import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, LayoutGrid, Rows3, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { COURSES } from '@/data/academics';
import {
  BOOK_COLLECTIONS,
  BOOK_CONDITIONS,
  BOOK_SUBJECTS,
  CONDITION_LABELS,
  TRANSACTION_LABELS,
  SELLERS,
} from '@/data/books';
import {
  EMPTY_BOOK_FILTERS,
  BookCard,
  useFilteredBooks,
  type BookFilterState,
} from './components';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Badge, Button, EmptyState, Panel, SectionHeader, StatTile } from '@/components/ui/primitives';
import { Checkbox, Field, FilterPill, SearchField, Select } from '@/components/ui/fields';
import { Modal } from '@/components/ui/overlays';
import { SmartImage } from '@/components/ui/SmartImage';
import { ModuleHero, IntegrationNotice } from '@/features/shared';
import type { BookCondition, TransactionType } from '@/lib/types';

export default function BooksDiscoverPage() {
  const { books, state, toggleSaved, isSaved } = useApp();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState<BookFilterState>({
    ...EMPTY_BOOK_FILTERS,
    query: params.get('q') ?? '',
    subjects: params.get('subject') ? [params.get('subject')!] : [],
  });
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const myCourseCodes = useMemo(() => COURSES.map((course) => course.code), []);
  const filtered = useFilteredBooks(books, filters, myCourseCodes);

  const recentlyAdded = useMemo(
    () =>
      [...books]
        .filter((book) => book.status === 'active')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4),
    [books],
  );

  const affordable = useMemo(
    () =>
      [...books]
        .filter((book) => book.status === 'active' && book.transaction === 'sale' && book.price.amount <= 800)
        .sort((a, b) => a.price.amount - b.price.amount)
        .slice(0, 4),
    [books],
  );

  const subjectCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const book of books) {
      if (book.status !== 'active') continue;
      counts.set(book.subject, (counts.get(book.subject) ?? 0) + 1);
    }
    return counts;
  }, [books]);

  const freeAndShared = useMemo(
    () => books.filter((book) => book.transaction === 'free' || book.transaction === 'borrow' || book.transaction === 'exchange'),
    [books],
  );

  const activeFilterCount =
    filters.subjects.length +
    filters.conditions.length +
    filters.transactions.length +
    (filters.courseOnly ? 1 : 0) +
    (filters.maxPrice < 2000 ? 1 : 0);

  function update<K extends keyof BookFilterState>(key: K, value: BookFilterState[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function toggleArrayValue<T extends string>(key: 'subjects' | 'conditions' | 'transactions', value: T) {
    setFilters((current) => {
      const list = current[key] as string[];
      const next = list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
      return { ...current, [key]: next } as BookFilterState;
    });
  }

  function reset() {
    setFilters({ ...EMPTY_BOOK_FILTERS });
    setParams({});
  }

  function applySearch(value: string) {
    update('query', value);
    if (value.trim().length > 0) setParams({ q: value.trim() });
    else setParams({});
  }

  const filterPanel = (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.8125rem] font-medium text-fg">Filters</p>
        {activeFilterCount > 0 ? (
          <button type="button" onClick={reset} className="text-xs text-accent hover:text-accent-hover">
            Clear all ({activeFilterCount})
          </button>
        ) : null}
      </div>

      <Field label="Subject">
        <div className="flex flex-wrap gap-1.5">
          {BOOK_SUBJECTS.map((subject) => (
            <FilterPill
              key={subject}
              active={filters.subjects.includes(subject)}
              count={subjectCounts.get(subject) ?? 0}
              onClick={() => toggleArrayValue('subjects', subject)}
            >
              {subject}
            </FilterPill>
          ))}
        </div>
      </Field>

      <Field label="Condition">
        <div className="space-y-2.5">
          {BOOK_CONDITIONS.map((condition) => (
            <Checkbox
              key={condition.value}
              checked={filters.conditions.includes(condition.value)}
              onChange={() => toggleArrayValue<BookCondition>('conditions', condition.value)}
              label={condition.label}
              hint={condition.hint}
            />
          ))}
        </div>
      </Field>

      <Field label="Transaction">
        <div className="flex flex-wrap gap-1.5">
          {(['sale', 'borrow', 'exchange', 'free'] as TransactionType[]).map((transaction) => (
            <FilterPill
              key={transaction}
              active={filters.transactions.includes(transaction)}
              onClick={() => toggleArrayValue<TransactionType>('transactions', transaction)}
            >
              {TRANSACTION_LABELS[transaction]}
            </FilterPill>
          ))}
        </div>
      </Field>

      <Field label={`Maximum price · ${formatMoney({ amount: filters.maxPrice, currency: 'INR' })}`}>
        <input
          type="range"
          min={0}
          max={2000}
          step={50}
          value={filters.maxPrice}
          onChange={(event) => update('maxPrice', Number(event.target.value))}
          className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-[var(--accent)]"
          aria-label="Maximum price"
        />
      </Field>

      <Checkbox
        checked={filters.courseOnly}
        onChange={(checked) => update('courseOnly', checked)}
        label="Only books for my courses"
        hint={`Matches listings tagged with any of your ${myCourseCodes.length} registered course codes.`}
      />

      <Field label="Sort by">
        <Select value={filters.sort} onChange={(event) => update('sort', event.target.value as BookFilterState['sort'])}>
          <option value="recent">Recently listed</option>
          <option value="price-asc">Price, low to high</option>
          <option value="price-desc">Price, high to low</option>
          <option value="title">Title, A to Z</option>
        </Select>
      </Field>
    </div>
  );

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Books & academic resources"
        title="The campus book market, without the group-chat chaos"
        description="Used textbooks, departmental surplus, free course packs and lent copies — all from people at your institution, with condition, edition and pickup point stated up front."
        meta={
          <>
            <Badge tone="accent">{books.filter((book) => book.status === 'active').length} active listings</Badge>
            <Badge tone="teal">
              {freeAndShared.length} free, lent or exchange
            </Badge>
            <Badge tone="muted">{SELLERS.length} sellers</Badge>
          </>
        }
        actions={
          <>
            <Link
              to="/books/new"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
            >
              List a book
            </Link>
            <Link
              to="/books/my-listings"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm text-fg transition-colors hover:border-line-strong"
            >
              My listings
            </Link>
          </>
        }
        aside={
          <div className="space-y-3">
            <SearchField
              value={filters.query}
              onChange={applySearch}
              size="lg"
              placeholder="Title, author, ISBN or course code"
              label="Search books"
            />
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Under ₹800" value={affordable.length} hint="Cheapest used copies" />
              <StatTile label="Saved" value={state.saved.filter((item) => item.kind === 'book').length} hint="Your bookmarks" />
            </div>
          </div>
        }
      />

      <IntegrationNotice integrationId="payments" />

      {/* Featured collections — editorial entry points */}
      <div className="grid gap-4 lg:grid-cols-3">
        {BOOK_COLLECTIONS.map((collection) => (
          <Panel key={collection.id} padded={false} className="group overflow-hidden">
            <Link to={`/books?subject=${encodeURIComponent(collection.title.split(' ')[0])}`} className="block">
              <div className="relative">
                <SmartImage src={collection.image} alt="" ratio="16 / 9" sizes="(max-width: 1024px) 100vw, 380px" />
                <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/40 to-transparent" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="caps">{collection.eyebrow}</p>
                  <h3 className="display mt-1.5 text-[1.25rem] text-fg">{collection.title}</h3>
                </div>
              </div>
            </Link>
            <div className="p-4">
              <p className="text-xs leading-relaxed text-fg-muted">{collection.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {collection.bookIds.slice(0, 3).map((id) => {
                  const book = books.find((entry) => entry.id === id);
                  if (!book) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => isSaved(id) || toggleSaved({ kind: 'book', refId: id, title: book.title, subtitle: book.author, href: `/books/${id}` })}
                      className="max-w-full truncate rounded-md border border-line bg-surface/60 px-2 py-1 text-[0.6875rem] text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
                    >
                      {book.title}
                    </button>
                  );
                })}
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
        <aside className="hidden lg:block">
          <Panel strength="panel" className="sticky top-24">{filterPanel}</Panel>
        </aside>

        <div className="min-w-0 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="display text-[1.5rem] text-fg">
                {filters.query ? `Results for “${filters.query}”` : 'Everything on the shelf'}
              </h2>
              <p className="mt-1 text-xs text-fg-muted">
                {filtered.length} {filtered.length === 1 ? 'listing' : 'listings'}
                {activeFilterCount > 0 ? ` · ${activeFilterCount} filters applied` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="lg:hidden"
                icon={<SlidersHorizontal className="size-4" />}
                onClick={() => setFiltersOpen(true)}
              >
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Button>
              <div className="flex rounded-lg border border-line p-0.5">
                <button
                  type="button"
                  aria-label="Grid layout"
                  aria-pressed={layout === 'grid'}
                  onClick={() => setLayout('grid')}
                  className={cn(
                    'rounded-md p-1.5 transition-colors',
                    layout === 'grid' ? 'bg-surface/80 text-fg' : 'text-fg-subtle hover:text-fg',
                  )}
                >
                  <LayoutGrid className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="List layout"
                  aria-pressed={layout === 'list'}
                  onClick={() => setLayout('list')}
                  className={cn(
                    'rounded-md p-1.5 transition-colors',
                    layout === 'list' ? 'bg-surface/80 text-fg' : 'text-fg-subtle hover:text-fg',
                  )}
                >
                  <Rows3 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {activeFilterCount > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {filters.subjects.map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => toggleArrayValue('subjects', subject)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-2.5 py-1 text-[0.6875rem] text-accent"
                >
                  {subject}
                  <X className="size-3" aria-hidden="true" />
                </button>
              ))}
              {filters.conditions.map((condition) => (
                <button
                  key={condition}
                  type="button"
                  onClick={() => toggleArrayValue<BookCondition>('conditions', condition)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-2.5 py-1 text-[0.6875rem] text-accent"
                >
                  {CONDITION_LABELS[condition]}
                  <X className="size-3" aria-hidden="true" />
                </button>
              ))}
              {filters.transactions.map((transaction) => (
                <button
                  key={transaction}
                  type="button"
                  onClick={() => toggleArrayValue<TransactionType>('transactions', transaction)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-2.5 py-1 text-[0.6875rem] text-accent"
                >
                  {TRANSACTION_LABELS[transaction]}
                  <X className="size-3" aria-hidden="true" />
                </button>
              ))}
              <button type="button" onClick={reset} className="text-[0.6875rem] text-fg-subtle hover:text-fg">
                Clear all
              </button>
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="size-5" aria-hidden="true" />}
              title="No listings match those filters"
              description="Try widening the price range, clearing the subject filter, or searching for a course code such as CS301."
              action={
                <>
                  <Button variant="secondary" onClick={reset}>
                    Clear filters
                  </Button>
                  <Link
                    to="/books/new"
                    className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover"
                  >
                    List the first copy
                  </Link>
                </>
              }
            />
          ) : (
            <div
              className={cn(
                layout === 'grid'
                  ? 'grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-4'
                  : 'space-y-3',
              )}
            >
              {filtered.map((book) => (
                <BookCard key={book.id} book={book} layout={layout} />
              ))}
            </div>
          )}

          <Panel>
            <SectionHeader
              eyebrow="Freshly listed"
              title="Recently added"
              description="The newest listings on campus, in the order they were posted."
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {recentlyAdded.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionHeader
              eyebrow="Under ₹800"
              title="Cheap and cheerful"
              description="Used copies priced for a student budget, cheapest first."
              action={
                <span className="flex items-center gap-1.5 text-[0.6875rem] text-fg-subtle">
                  <Sparkles className="size-3.5 text-accent" aria-hidden="true" />
                  No payment collection on CampusOS
                </span>
              }
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {affordable.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter listings"
        description="Filters apply as you change them."
        size="sm"
        footer={
          <Button variant="primary" onClick={() => setFiltersOpen(false)}>
            Show {filtered.length} results
          </Button>
        }
      >
        {filterPanel}
      </Modal>
    </div>
  );
}
