import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, CornerDownLeft, History, Search, X } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { cn } from '@/lib/cn';
import {
  SEARCH_KIND_LABELS,
  SEARCH_KIND_ORDER,
  buildIndex,
  searchAll,
  type SearchResult,
} from '@/lib/search';
import { FilterPill, SearchField } from '@/components/ui/fields';
import { Badge, Kbd } from '@/components/ui/primitives';
import { ALL_NAV_ITEMS } from '@/config/navigation';
import type { SearchKind } from '@/lib/types';

interface PaletteRow {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  href: string;
  badge: string;
  kind: SearchKind | 'navigation' | 'recent';
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { state, recordSearch, clearRecentSearches } = useApp();
  const reduced = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [kinds, setKinds] = useState<SearchKind[]>([]);

  const index = useMemo(() => buildIndex(), []);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
      setKinds([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const rows = useMemo<PaletteRow[]>(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      const recent: PaletteRow[] = state.recentSearches.map((term) => ({
        id: `recent:${term}`,
        title: term,
        subtitle: 'Recent search',
        meta: 'Press Enter to search again',
        href: `/search?q=${encodeURIComponent(term)}`,
        badge: 'Recent',
        kind: 'recent',
      }));
      const navigation: PaletteRow[] = ALL_NAV_ITEMS.map((item) => ({
        id: `nav:${item.id}`,
        title: item.label,
        subtitle: item.description,
        meta: item.href,
        href: item.href,
        badge: 'Go to',
        kind: 'navigation',
      }));
      return [...recent, ...navigation];
    }

    const results = searchAll(trimmed, index, { kinds: kinds.length > 0 ? kinds : undefined, limit: 40 });
    const grouped: PaletteRow[] = [];
    for (const kind of SEARCH_KIND_ORDER) {
      const inKind = results.filter((result) => result.kind === kind).slice(0, 4);
      for (const result of inKind) grouped.push(toRow(result));
    }
    grouped.push({
      id: 'all-results',
      title: `Search everything for “${trimmed}”`,
      subtitle: 'Opens the full search page with filters',
      meta: `${results.length} matches`,
      href: `/search?q=${encodeURIComponent(trimmed)}`,
      badge: 'Search',
      kind: 'navigation',
    });
    return grouped;
  }, [query, index, kinds, state.recentSearches]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, kinds]);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-row="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function selectRow(row: PaletteRow) {
    if (row.kind !== 'recent' && row.kind !== 'navigation') recordSearch(query);
    navigate(row.href);
    onClose();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, rows.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const row = rows[activeIndex];
      if (row) selectRow(row);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'Tab') {
      event.preventDefault();
    }
  }

  const availableKinds = SEARCH_KIND_ORDER;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[8vh] sm:pt-[12vh]">
          <motion.div
            className="fixed inset-0 bg-overlay backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search CampusOS"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.985 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: reduced ? 0.12 : 0.26, ease: [0.22, 1, 0.36, 1] }}
            onKeyDown={onKeyDown}
            className="glass-surface glass-float relative flex max-h-[76dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line"
          >
            <div className="border-b border-line px-4 py-3.5">
              <SearchField
                inputRef={inputRef}
                value={query}
                onChange={setQuery}
                size="lg"
                label="Search all of CampusOS"
                placeholder="Search books, opportunities, notices, parking, documents"
                trailing={
                  <>
                    <Kbd>esc</Kbd>
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Close search"
                      className="rounded-lg p-2 text-fg-subtle transition-colors hover:text-fg"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </>
                }
              />
              <div className="no-scrollbar mt-3 flex items-center gap-1.5 overflow-x-auto">
                <FilterPill active={kinds.length === 0} onClick={() => setKinds([])}>
                  All modules
                </FilterPill>
                {availableKinds.map((kind) => (
                  <FilterPill
                    key={kind}
                    active={kinds.includes(kind)}
                    onClick={() =>
                      setKinds((current) =>
                        current.includes(kind) ? current.filter((entry) => entry !== kind) : [...current, kind],
                      )
                    }
                  >
                    {SEARCH_KIND_LABELS[kind]}
                  </FilterPill>
                ))}
              </div>
            </div>

            <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-2" role="listbox" aria-label="Search results">
              {rows.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                  <Search className="size-5 text-fg-subtle" aria-hidden="true" />
                  <p className="text-sm text-fg">Nothing matches “{query}”</p>
                  <p className="max-w-xs text-xs leading-relaxed text-fg-muted">
                    Search covers titles, authors, employers, notice text, courses and parking areas. Try a shorter
                    term or clear the module filters.
                  </p>
                </div>
              ) : (
                rows.map((row, position) => {
                  const active = position === activeIndex;
                  const showHeading =
                    position === 0 || rows[position - 1]?.kind !== row.kind;
                  return (
                    <div key={row.id}>
                      {showHeading ? (
                        <p className="px-3 pb-1.5 pt-3 text-[0.625rem] uppercase tracking-[0.16em] text-fg-subtle">
                          {row.kind === 'navigation' ? 'Navigation' : row.kind === 'recent' ? 'Recent searches' : SEARCH_KIND_LABELS[row.kind]}
                        </p>
                      ) : null}
                      <button
                        type="button"
                        role="option"
                        data-row={position}
                        aria-selected={active}
                        onMouseMove={() => setActiveIndex(position)}
                        onClick={() => selectRow(row)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150',
                          active ? 'bg-surface/80' : 'hover:bg-surface/50',
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-[0.8125rem] font-medium text-fg">{row.title}</span>
                            <Badge tone={active ? 'accent' : 'muted'} className="shrink-0">
                              {row.badge}
                            </Badge>
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-fg-muted">{row.subtitle}</span>
                        </span>
                        {row.kind === 'recent' ? (
                          <History className="size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
                        ) : (
                          <ArrowRight
                            className={cn('size-4 shrink-0 transition-opacity', active ? 'text-accent opacity-100' : 'opacity-0')}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-[0.6875rem] text-fg-subtle">
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd> navigate
                </span>
                <span className="flex items-center gap-1.5">
                  <Kbd>
                    <CornerDownLeft className="size-3" aria-hidden="true" />
                  </Kbd>
                  open
                </span>
              </span>
              {state.recentSearches.length > 0 && query.length === 0 ? (
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="transition-colors hover:text-fg"
                >
                  Clear recent searches
                </button>
              ) : null}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function toRow(result: SearchResult): PaletteRow {
  return {
    id: result.id,
    title: result.title,
    subtitle: result.subtitle,
    meta: result.meta,
    href: result.href,
    badge: SEARCH_KIND_LABELS[result.kind],
    kind: result.kind,
  };
}
