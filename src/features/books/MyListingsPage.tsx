import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Eye, Package, Pencil, ShieldCheck, Trash, TriangleAlert } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { CONDITION_LABELS, TRANSACTION_LABELS } from '@/data/books';
import { formatDate, formatMoney, relativeTime } from '@/lib/format';
import {
  Badge,
  Button,
  DataOriginTag,
  EmptyState,
  InlineNote,
  Panel,
  SectionHeader,
  StatTile,
  type Tone,
} from '@/components/ui/primitives';
import { SmartImage } from '@/components/ui/SmartImage';
import { ConfirmDialog, Tabs } from '@/components/ui/overlays';
import { useToast } from '@/components/ui/Toast';
import { ModuleHero } from '@/features/shared';
import type { Book, ListingStatus } from '@/lib/types';

const STATUS_TONE: Record<ListingStatus, Tone> = {
  active: 'ok',
  reserved: 'warn',
  sold: 'muted',
  'under-review': 'accent',
  removed: 'danger',
};

const STATUS_LABEL: Record<ListingStatus, string> = {
  active: 'Live',
  reserved: 'Reserved',
  sold: 'Sold',
  'under-review': 'In moderation',
  removed: 'Removed',
};

export default function MyListingsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { state, updateListing, removeListing } = useApp();
  const [tab, setTab] = useState<'all' | ListingStatus>('all');
  const [confirm, setConfirm] = useState<Book | null>(null);

  const listings = state.listings;
  const filtered = useMemo(
    () => (tab === 'all' ? listings : listings.filter((listing) => listing.status === tab)),
    [listings, tab],
  );

  const stats = useMemo(
    () => ({
      live: listings.filter((listing) => listing.status === 'active').length,
      review: listings.filter((listing) => listing.status === 'under-review').length,
      reserved: listings.filter((listing) => listing.status === 'reserved').length,
      value: listings
        .filter((listing) => listing.status === 'active')
        .reduce((sum, listing) => sum + listing.price.amount, 0),
    }),
    [listings],
  );

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Books & resources"
        title="Your listings"
        description="Everything you have put on the shelf, with the moderation state of each copy. New listings are hidden from search until a moderator reviews them."
        meta={
          <>
            <Badge tone="accent">{listings.length} total</Badge>
            <Badge tone="ok">{stats.live} live</Badge>
            {stats.review > 0 ? <Badge tone="warn">{stats.review} in moderation</Badge> : null}
          </>
        }
        actions={
          <Link
            to="/books/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
          >
            Create a listing
          </Link>
        }
        aside={
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Live" value={stats.live} hint="Visible in search" />
            <StatTile label="Reserved" value={stats.reserved} hint="Held for a buyer" />
            <StatTile
              label="Listed value"
              value={formatMoney({ amount: stats.value, currency: 'INR' })}
              hint="Sum of live asking prices"
            />
            <StatTile label="In review" value={stats.review} hint="Awaiting moderation" />
          </div>
        }
      />

      {listings.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-5" aria-hidden="true" />}
          title="You have not listed anything yet"
          description="Listing a textbook takes about a minute: condition, edition, price and where it can be collected. You can edit or withdraw a listing at any time."
          action={
            <Link
              to="/books/new"
              className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover"
            >
              List your first book
            </Link>
          }
        />
      ) : (
        <>
          <Tabs
            ariaLabel="Listing filters"
            variant="segmented"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'all', label: 'All', count: listings.length },
              { value: 'active', label: 'Live', count: stats.live },
              { value: 'reserved', label: 'Reserved', count: stats.reserved },
              { value: 'under-review', label: 'In review', count: stats.review },
              { value: 'sold', label: 'Sold', count: listings.filter((l) => l.status === 'sold').length },
            ]}
          />

          {filtered.length === 0 ? (
            <EmptyState
              title="Nothing in this state"
              description="Try another tab — listings move between live, reserved, sold and moderation states."
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((listing) => (
                <Panel key={listing.id} className="flex flex-col gap-4 sm:flex-row">
                  <Link to={`/books/${listing.id}`} className="w-24 shrink-0">
                    {listing.coverImage ? (
                      <SmartImage
                        src={listing.coverImage}
                        alt=""
                        ratio="3 / 4"
                        wrapperClassName="rounded-xl border border-line"
                        sizes="96px"
                      />
                    ) : (
                      <div
                        className="rounded-xl border border-line"
                        style={{ aspectRatio: '3 / 4', background: 'linear-gradient(150deg, var(--raised), var(--sunken))' }}
                      />
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={STATUS_TONE[listing.status]}>{STATUS_LABEL[listing.status]}</Badge>
                      <Badge tone="muted">{CONDITION_LABELS[listing.condition]}</Badge>
                      <Badge tone="neutral">{TRANSACTION_LABELS[listing.transaction]}</Badge>
                      <DataOriginTag origin={listing.origin} />
                    </div>
                    <h3 className="mt-2 text-[0.9375rem] font-medium text-fg">{listing.title}</h3>
                    <p className="mt-1 text-xs text-fg-muted">
                      {listing.author} · {listing.edition}
                    </p>
                    <p className="numeric mt-2 text-[0.9375rem] text-fg">
                      {listing.price.amount > 0 ? formatMoney(listing.price) : TRANSACTION_LABELS[listing.transaction]}
                    </p>
                    <p className="mt-1.5 text-[0.6875rem] text-fg-subtle">
                      Listed {relativeTime(listing.createdAt)} · own listing since {formatDate(listing.createdAt, 'short')}
                    </p>

                    {listing.status === 'under-review' ? (
                      <InlineNote tone="neutral" className="mt-3" title="Why is this hidden?">
                        New and edited listings wait for moderation so that mispriced or unsafe posts do not reach
                        search. Nothing you submitted has been lost.
                      </InlineNote>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="quiet" icon={<Pencil className="size-3.5" />} onClick={() => navigate(`/books/${listing.id}/edit`)}>
                        Edit
                      </Button>
                      {listing.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="quiet"
                          onClick={() => {
                            updateListing(listing.id, { status: 'reserved' });
                            toast.success('Marked as reserved', 'It stays visible but shows as held.');
                          }}
                        >
                          Mark reserved
                        </Button>
                      ) : null}
                      {listing.status === 'reserved' ? (
                        <Button
                          size="sm"
                          variant="quiet"
                          onClick={() => {
                            updateListing(listing.id, { status: 'active' });
                            toast.success('Back on the shelf', 'The listing is available again.');
                          }}
                        >
                          Release
                        </Button>
                      ) : null}
                      {listing.status !== 'sold' ? (
                        <Button
                          size="sm"
                          variant="quiet"
                          icon={<Package className="size-3.5" />}
                          onClick={() => {
                            updateListing(listing.id, { status: 'sold' });
                            toast.success('Marked as sold', 'Congratulations — no transaction was recorded by CampusOS.');
                          }}
                        >
                          Mark sold
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Eye className="size-3.5" />}
                        onClick={() => navigate(`/books/${listing.id}`)}
                      >
                        View public page
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-danger"
                        icon={<Trash className="size-3.5" />}
                        onClick={() => setConfirm(listing)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </>
      )}

      <Panel strength="quiet">
        <SectionHeader
          eyebrow="How moderation works"
          title="Honest by default"
          description="Sample content is labelled, seller claims are attributed, and nothing pretends to be a completed transaction."
        />
        <ul className="mt-5 grid gap-4 sm:grid-cols-3">
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />
            <span className="text-xs leading-relaxed text-fg-muted">
              <span className="block font-medium text-fg">Reviewed before search</span>
              New listings stay out of results until a moderator approves them.
            </span>
          </li>
          <li className="flex gap-3">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
            <span className="text-xs leading-relaxed text-fg-muted">
              <span className="block font-medium text-fg">No invented reviews</span>
              No ratings or reviews are displayed, because none are collected.
            </span>
          </li>
          <li className="flex gap-3">
            <Package className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
            <span className="text-xs leading-relaxed text-fg-muted">
              <span className="block font-medium text-fg">No payment collection</span>
              Marking a copy sold is a status change, not a recorded transaction.
            </span>
          </li>
        </ul>
      </Panel>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            removeListing(confirm.id);
            toast.success('Listing removed', 'It is no longer visible on the shelf.');
          }
          setConfirm(null);
        }}
        title="Remove this listing?"
        description={confirm ? `“${confirm.title}” will be taken off the shelf immediately.` : ''}
        confirmLabel="Remove listing"
        destructive
      />
    </div>
  );
}
