import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BookOpen, CircleParking, Compass, FileText, GraduationCap } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { SEARCH_KIND_LABELS } from '@/lib/search';
import { formatDate, relativeTime } from '@/lib/format';
import {
  Badge,
  Button,
  EmptyState,
  Panel,
  SectionHeader,
  StatTile,
} from '@/components/ui/primitives';
import { FilterPill } from '@/components/ui/fields';
import { ModuleHero } from '@/features/shared';
import type { SavedKind } from '@/lib/types';

const KIND_ICON: Record<SavedKind, typeof Bookmark> = {
  book: BookOpen,
  opportunity: Compass,
  notice: GraduationCap,
  parking: CircleParking,
  document: FileText,
  assignment: FileText,
};

export default function SavedPage() {
  const { state, removeSaved } = useApp();
  const [kind, setKind] = useState<SavedKind | 'all'>('all');

  const grouped = useMemo(() => {
    const map = new Map<SavedKind, typeof state.saved>();
    for (const item of state.saved) {
      const list = map.get(item.kind) ?? [];
      list.push(item);
      map.set(item.kind, list);
    }
    return map;
  }, [state.saved]);

  const filtered = useMemo(
    () =>
      [...state.saved]
        .filter((item) => kind === 'all' || item.kind === kind)
        .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()),
    [state.saved, kind],
  );

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Across CampusOS"
        title="Saved items"
        description="One shortlist spanning every module: books you are considering, roles worth applying to, notices to act on and parking areas you use."
        meta={
          <>
            <Badge tone="accent">{state.saved.length} saved</Badge>
            <Badge tone="muted">{grouped.size} modules represented</Badge>
          </>
        }
        aside={
          <div className="grid grid-cols-2 gap-3">
            {[...grouped.entries()].slice(0, 4).map(([entryKind, items]) => (
              <StatTile
                key={entryKind}
                label={SEARCH_KIND_LABELS[entryKind] ?? entryKind}
                value={items.length}
                hint="Saved items"
                icon={(() => {
                  const Icon = KIND_ICON[entryKind];
                  return <Icon className="size-4" />;
                })()}
              />
            ))}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <FilterPill active={kind === 'all'} onClick={() => setKind('all')} count={state.saved.length}>
          Everything
        </FilterPill>
        {[...grouped.entries()].map(([entryKind, items]) => (
          <FilterPill key={entryKind} active={kind === entryKind} onClick={() => setKind(entryKind)} count={items.length}>
            {SEARCH_KIND_LABELS[entryKind] ?? entryKind}
          </FilterPill>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="size-5" aria-hidden="true" />}
          title="Nothing saved yet"
          description="Save a book, opportunity, notice, document or parking area and it collects here, whichever module it came from."
          action={
            <>
              <Link
                to="/books"
                className="inline-flex h-10 items-center rounded-xl border border-line px-4 text-sm text-fg transition-colors hover:border-line-strong"
              >
                Browse books
              </Link>
              <Link
                to="/opportunities"
                className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover"
              >
                Find opportunities
              </Link>
            </>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const Icon = KIND_ICON[item.kind];
            return (
              <Panel key={item.id} className="flex flex-wrap items-center gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface/55 text-accent">
                  <Icon className="size-[1.125rem]" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="muted">{SEARCH_KIND_LABELS[item.kind] ?? item.kind}</Badge>
                    <span className="text-[0.6875rem] text-fg-subtle">saved {relativeTime(item.savedAt)}</span>
                  </div>
                  <Link to={item.href} className="mt-2 block">
                    <h3 className="text-[0.9375rem] font-medium text-fg hover:text-accent">{item.title}</h3>
                  </Link>
                  <p className="mt-0.5 text-xs text-fg-muted">{item.subtitle}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={item.href}
                    className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-xs text-fg transition-colors hover:border-line-strong"
                  >
                    Open
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger"
                    onClick={() => removeSaved(item.refId)}
                  >
                    Remove
                  </Button>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      <Panel strength="quiet">
        <SectionHeader
          eyebrow="How saving works"
          title="Your shortlist stays yours"
          description={`Saved items are stored against your account in this browser. Last updated ${formatDate(new Date(), 'short')}.`}
        />
        <p className="mt-3 text-xs leading-relaxed text-fg-muted">
          Saving something never contacts the seller, employer or department, and it never reserves a place. It is a
          private note to yourself.
        </p>
      </Panel>
    </div>
  );
}
