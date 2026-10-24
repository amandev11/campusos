import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ROUTE_TITLES } from '@/config/navigation';
import { useApp } from '@/store/AppProvider';
import { BOOKS } from '@/data/books';
import { OPPORTUNITIES } from '@/data/opportunities';
import { PARKING_LOTS } from '@/data/parking';
import { cn } from '@/lib/cn';

interface Crumb {
  label: string;
  href?: string;
}

/** Builds the crumb trail from explicit route titles plus record lookups. */
function useCrumbs(): Crumb[] {
  const { pathname } = useLocation();
  const { state } = useApp();

  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [{ label: 'CampusOS', href: '/' }];

  if (segments.length === 0) {
    crumbs.push({ label: 'Overview' });
    return crumbs;
  }

  const recordLabel = (parent: string, id: string): string | null => {
    if (parent === 'books') {
      const book = state.listings.find((entry) => entry.id === id) ?? BOOKS.find((entry) => entry.id === id);
      return book?.title ?? null;
    }
    if (parent === 'opportunities') {
      return OPPORTUNITIES.find((entry) => entry.id === id)?.title ?? null;
    }
    if (parent === 'parking') {
      return PARKING_LOTS.find((entry) => entry.id === id)?.name ?? null;
    }
    return null;
  };

  let accumulated = '';
  segments.forEach((segment, index) => {
    accumulated += `/${segment}`;
    const title = ROUTE_TITLES[accumulated];
    const isLast = index === segments.length - 1;

    if (title) {
      crumbs.push(isLast ? { label: title } : { label: title, href: accumulated });
      return;
    }

    if (index > 0 && segments[index - 1]) {
      const resolved = recordLabel(segments[index - 1]!, segment);
      if (resolved) {
        crumbs.push({ label: resolved });
        return;
      }
    }

    crumbs.push({
      label: segment.replace(/-/g, ' ').replace(/^./, (character) => character.toUpperCase()),
      href: isLast ? undefined : accumulated,
    });
  });

  return crumbs;
}

export function Breadcrumbs({ compact = false }: { compact?: boolean }) {
  const crumbs = useCrumbs();
  const visible = compact ? crumbs.slice(-2) : crumbs.slice(-4);

  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0', compact && 'overflow-x-auto no-scrollbar')}>
      <ol className="flex items-center gap-1.5 text-xs">
        {visible.map((crumb, index) => {
          const isLast = index === visible.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 ? <ChevronRight className="size-3 shrink-0 text-fg-subtle" aria-hidden="true" /> : null}
              {crumb.href && !isLast ? (
                <Link
                  to={crumb.href}
                  className="truncate rounded text-fg-subtle transition-colors hover:text-fg"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={cn('truncate', isLast ? 'font-medium text-fg' : 'text-fg-subtle')}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
