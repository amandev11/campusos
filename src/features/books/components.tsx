import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, MapPin, Repeat, Store } from 'lucide-react';
import { CONDITION_LABELS, TRANSACTION_LABELS } from '@/data/books';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { SmartImage } from '@/components/ui/SmartImage';
import { Badge, DataOriginTag, type Tone } from '@/components/ui/primitives';
import { SaveButton } from '@/features/shared';
import { useApp } from '@/store/AppProvider';
import type { Book, BookCondition, TransactionType } from '@/lib/types';

export const CONDITION_TONE: Record<BookCondition, Tone> = {
  new: 'ok',
  'like-new': 'teal',
  good: 'accent',
  fair: 'warn',
};

export const TRANSACTION_TONE: Record<TransactionType, Tone> = {
  sale: 'accent',
  borrow: 'teal',
  exchange: 'warn',
  free: 'ok',
};

export function TransactionBadge({ transaction }: { transaction: TransactionType }) {
  const Icon = transaction === 'borrow' ? Store : transaction === 'exchange' ? Repeat : null;
  return (
    <Badge tone={TRANSACTION_TONE[transaction]} icon={Icon ? <Icon className="size-3" aria-hidden="true" /> : null}>
      {TRANSACTION_LABELS[transaction]}
    </Badge>
  );
}

export function BookCover({
  book,
  className,
  ratio = '3 / 4.2',
  sizes,
}: {
  book: Book;
  className?: string;
  ratio?: string;
  sizes?: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-line bg-surface/60',
        className,
      )}
    >
      {book.coverImage ? (
        <SmartImage
          src={book.coverImage}
          alt={`Cover of ${book.title}`}
          ratio={ratio}
          sizes={sizes}
          fallbackLabel={book.subject}
        />
      ) : (
        <div
          className="flex flex-col justify-between p-4"
          style={{ aspectRatio: ratio, background: 'linear-gradient(150deg, var(--raised), var(--sunken))' }}
        >
          <p className="caps">{book.subject}</p>
          <p className="display text-lg leading-tight text-fg">{book.title}</p>
        </div>
      )}
      {book.status === 'sold' ? (
        <div className="absolute inset-0 flex items-center justify-center bg-canvas/70">
          <span className="rounded-full border border-line bg-raised px-3 py-1 text-xs font-medium text-fg-muted">
            Sold
          </span>
        </div>
      ) : null}
      {book.status === 'reserved' ? (
        <div className="absolute right-2 top-2">
          <Badge tone="warn">Reserved</Badge>
        </div>
      ) : null}
    </div>
  );
}

export function BookCard({
  book,
  layout = 'grid',
  showActions = true,
}: {
  book: Book;
  layout?: 'grid' | 'list' | 'compact';
  showActions?: boolean;
}) {
  const { isSaved } = useApp();
  const saved = isSaved(book.id);
  const discounted = book.retailPrice && book.retailPrice.amount > book.price.amount;

  if (layout === 'compact') {
    return (
      <Link
        to={`/books/${book.id}`}
        className="group flex items-center gap-3 rounded-xl border border-transparent p-2 transition-colors hover:border-line hover:bg-surface/50"
      >
        <div className="w-12 shrink-0">
          <BookCover book={book} ratio="3 / 4.2" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.8125rem] font-medium text-fg group-hover:text-accent">{book.title}</p>
          <p className="mt-0.5 truncate text-xs text-fg-subtle">
            {book.author} · {book.edition}
          </p>
          <p className="numeric mt-1 text-xs text-fg">{formatMoney(book.price)}</p>
        </div>
      </Link>
    );
  }

  if (layout === 'list') {
    return (
      <article className="group flex gap-4 rounded-2xl border border-line bg-surface/40 p-3 transition-all duration-300 hover:border-line-strong hover:bg-surface/60 sm:p-4">
        <Link to={`/books/${book.id}`} className="w-20 shrink-0 sm:w-24" aria-label={book.title}>
          <BookCover book={book} />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <Link to={`/books/${book.id}`} className="block">
                <h3 className="truncate text-[0.9375rem] font-medium text-fg transition-colors group-hover:text-accent">
                  {book.title}
                </h3>
              </Link>
              <p className="mt-0.5 truncate text-xs text-fg-muted">
                {book.author} · {book.edition}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="numeric text-[0.9375rem] text-fg">{formatMoney(book.price)}</span>
              {discounted ? (
                <span className="numeric text-[0.6875rem] text-fg-subtle line-through">
                  {formatMoney(book.retailPrice!)}
                </span>
              ) : null}
            </div>
          </div>
          <p className="mt-2 line-clamp-2 hidden text-xs leading-relaxed text-fg-muted sm:block">{book.description}</p>
          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
            <TransactionBadge transaction={book.transaction} />
            <Badge tone={CONDITION_TONE[book.condition]}>{CONDITION_LABELS[book.condition]}</Badge>
            <span className="flex items-center gap-1 text-[0.6875rem] text-fg-subtle">
              <MapPin className="size-3" aria-hidden="true" />
              {book.location}
            </span>
            {book.origin === 'demo' ? <DataOriginTag origin="demo" /> : null}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface/40 transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-elev-3">
      <Link to={`/books/${book.id}`} className="relative block" aria-label={`View ${book.title}`}>
        <SmartImage
          src={book.coverImage}
          alt={`Cover of ${book.title}`}
          ratio="3 / 4"
          sizes="(max-width: 640px) 45vw, 260px"
          fallbackLabel={book.subject}
        />
        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          <TransactionBadge transaction={book.transaction} />
          {book.status === 'reserved' ? <Badge tone="warn">Reserved</Badge> : null}
          {book.status === 'sold' ? <Badge tone="muted">Sold</Badge> : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-3.5">
        <p className="caps">{book.subject}</p>
        <Link to={`/books/${book.id}`} className="mt-1.5 block">
          <h3 className="line-clamp-2 text-[0.875rem] font-medium leading-snug text-fg transition-colors group-hover:text-accent">
            {book.title}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-1 text-xs text-fg-subtle">{book.author}</p>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="numeric text-[0.9375rem] text-fg">{formatMoney(book.price)}</span>
          {discounted ? (
            <span className="numeric text-[0.6875rem] text-fg-subtle line-through">{formatMoney(book.retailPrice!)}</span>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge tone={CONDITION_TONE[book.condition]}>{CONDITION_LABELS[book.condition]}</Badge>
          {book.courseCodes[0] ? <Badge tone="muted">{book.courseCodes[0]}</Badge> : null}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
          <span className="flex min-w-0 items-center gap-1.5 text-[0.6875rem] text-fg-subtle">
            <MapPin className="size-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{book.location}</span>
          </span>
          {showActions ? (
            <SaveButton
              kind="book"
              refId={book.id}
              title={book.title}
              subtitle={`${book.author} · ${book.location}`}
              href={`/books/${book.id}`}
              size="sm"
              variant="ghost"
              withLabel={false}
              className={saved ? 'text-accent' : ''}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

/** Small verified-style marker used on department-owned listings. */
export function SellerMarker({ book }: { book: Book }) {
  const isDepartment = book.seller.id === 'sel-devlibrary';
  if (!isDepartment) return null;
  return (
    <Badge tone="teal" icon={<BadgeCheck className="size-3" aria-hidden="true" />}>
      Departmental listing
    </Badge>
  );
}

export interface BookFilterState {
  query: string;
  subjects: string[];
  conditions: BookCondition[];
  transactions: TransactionType[];
  maxPrice: number;
  courseOnly: boolean;
  sort: 'recent' | 'price-asc' | 'price-desc' | 'title';
}

export const EMPTY_BOOK_FILTERS: BookFilterState = {
  query: '',
  subjects: [],
  conditions: [],
  transactions: [],
  maxPrice: 2000,
  courseOnly: false,
  sort: 'recent',
};

export function useFilteredBooks(books: Book[], filters: BookFilterState, myCourseCodes: string[]): Book[] {
  return useMemo(() => {
    const needle = filters.query.trim().toLowerCase();
    const result = books.filter((book) => {
      if (book.status === 'removed') return false;
      if (filters.subjects.length > 0 && !filters.subjects.includes(book.subject)) return false;
      if (filters.conditions.length > 0 && !filters.conditions.includes(book.condition)) return false;
      if (filters.transactions.length > 0 && !filters.transactions.includes(book.transaction)) return false;
      if (book.price.amount > filters.maxPrice) return false;
      if (filters.courseOnly && !book.courseCodes.some((code) => myCourseCodes.includes(code))) return false;
      if (needle.length > 0) {
        const haystack = `${book.title} ${book.author} ${book.subject} ${book.isbn} ${book.publisher} ${book.courseCodes.join(' ')} ${book.tags.join(' ')} ${book.seller.name}`.toLowerCase();
        if (!needle.split(/\s+/).every((term) => haystack.includes(term))) return false;
      }
      return true;
    });

    const sorted = [...result];
    switch (filters.sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price.amount - b.price.amount);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price.amount - a.price.amount);
        break;
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted;
  }, [books, filters, myCourseCodes]);
}
