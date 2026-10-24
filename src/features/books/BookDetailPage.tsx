import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  CalendarClock,
  Check,
  MapPin,
  MessageSquare,
  ShieldAlert,
  Store,
  Truck,
} from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { CONDITION_LABELS, TRANSACTION_LABELS } from '@/data/books';
import { formatDate, formatMoney, relativeTime } from '@/lib/format';
import {
  Badge,
  Button,
  DataOriginTag,
  Divider,
  EmptyState,
  InlineNote,
  KeyValue,
  Panel,
  SectionHeader,
} from '@/components/ui/primitives';
import { SmartImage } from '@/components/ui/SmartImage';
import { Modal } from '@/components/ui/overlays';
import { Field, TextArea } from '@/components/ui/fields';
import { BookCard, CONDITION_TONE, SellerMarker, TransactionBadge } from './components';
import { ReportButton, SaveButton } from '@/features/shared';
import { useToast } from '@/components/ui/Toast';

export default function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { books, startThread, state } = useApp();
  const [contactOpen, setContactOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const book = books.find((entry) => entry.id === bookId);

  const related = useMemo(() => {
    if (!book) return [];
    return books
      .filter((entry) => entry.id !== book.id && entry.status === 'active')
      .filter(
        (entry) =>
          entry.subject === book.subject ||
          entry.courseCodes.some((code) => book.courseCodes.includes(code)),
      )
      .slice(0, 4);
  }, [books, book]);

  const discount = book?.retailPrice ? Math.round((1 - book.price.amount / book.retailPrice.amount) * 100) : null;

  if (!book) {
    return (
      <EmptyState
        icon={<BookOpen className="size-5" aria-hidden="true" />}
        title="That listing is no longer available"
        description="It may have been removed by the seller or withdrawn during moderation. Browse the shelf for other copies."
        action={
          <Link
            to="/books"
            className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover"
          >
            Back to books
          </Link>
        }
      />
    );
  }

  function sendEnquiry() {
    if (message.trim().length < 10) {
      setError('Write at least a sentence so the seller knows what you are asking.');
      return;
    }
    const threadId = startThread({
      participantId: book!.seller.id,
      participantName: book!.seller.name,
      subject: book!.title,
      context: 'Books & Resources · listing enquiry',
      body: message.trim(),
    });
    setError(null);
    setContactOpen(false);
    toast.success('Message sent', 'Conversations are stored in this browser in demonstration mode.');
    navigate(`/messages?thread=${threadId}`);
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs text-fg-subtle transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back
      </button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="space-y-4">
          <Panel padded={false} className="overflow-hidden">
            <SmartImage
              src={book.coverImage}
              alt={`Cover of ${book.title}`}
              ratio="3 / 4"
              sizes="(max-width: 1024px) 90vw, 352px"
              priority
              fallbackLabel={book.subject}
            />
          </Panel>
          <Panel>
            <p className="caps">Seller</p>
            <p className="mt-2 text-[0.9375rem] font-medium text-fg">{book.seller.name}</p>
            <p className="mt-1 text-xs text-fg-muted">{book.seller.department}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone="muted">{book.seller.campus}</Badge>
              <SellerMarker book={book} />
            </div>
            <Divider />
            <dl className="space-y-0">
              <KeyValue label="Listings">{book.seller.listingsCount}</KeyValue>
              <KeyValue label="Deals completed">{book.seller.dealsCompleted}</KeyValue>
              <KeyValue label="Member since">{formatDate(book.seller.joinedAt, 'short')}</KeyValue>
            </dl>
            <p className="mt-3 text-[0.6875rem] leading-relaxed text-fg-subtle">
              Provided by the seller. CampusOS does not verify deals, ratings or completion counts, and no reviews are
              shown because none are collected.
            </p>
          </Panel>
        </div>

        <div className="min-w-0 space-y-5">
          <Panel>
            <div className="flex flex-wrap items-center gap-1.5">
              <TransactionBadge transaction={book.transaction} />
              <Badge tone={CONDITION_TONE[book.condition]}>{CONDITION_LABELS[book.condition]}</Badge>
              <Badge tone="muted">{book.subject}</Badge>
              <DataOriginTag origin={book.origin} />
              {book.status === 'under-review' ? <Badge tone="warn">Awaiting moderation</Badge> : null}
            </div>

            <h1 className="display mt-4 text-[1.875rem] leading-tight text-fg sm:text-[2.25rem]">{book.title}</h1>
            <p className="mt-2 text-[0.9375rem] text-fg-muted">
              {book.author} · {book.edition}
            </p>

            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="numeric text-[1.75rem] leading-none text-fg">{formatMoney(book.price)}</span>
              {book.retailPrice ? (
                <>
                  <span className="numeric text-sm text-fg-subtle line-through">
                    {formatMoney(book.retailPrice)}
                  </span>
                  {discount && discount > 0 ? <Badge tone="teal">{discount}% below new</Badge> : null}
                </>
              ) : null}
            </div>
            {book.transaction !== 'sale' ? (
              <p className="mt-2 text-xs text-fg-muted">
                {TRANSACTION_LABELS[book.transaction]} — no money changes hands for this listing.
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                icon={<MessageSquare className="size-4" />}
                onClick={() => setContactOpen(true)}
                disabled={book.status === 'sold'}
              >
                Message the seller
              </Button>
              <SaveButton
                kind="book"
                refId={book.id}
                title={book.title}
                subtitle={`${book.author} · ${book.location}`}
                href={`/books/${book.id}`}
                variant="secondary"
              />
              <ReportButton kind="book" refId={book.id} refLabel={book.title} />
            </div>

            {book.status === 'sold' ? (
              <InlineNote tone="warn" className="mt-5" title="This copy has been taken">
                The seller marked it as sold. Browse related listings below for another copy.
              </InlineNote>
            ) : null}
            {book.reported ? (
              <InlineNote tone="warn" className="mt-5" title="Reported by another student">
                This listing is flagged for moderation. Treat the details with caution until a moderator reviews it.
              </InlineNote>
            ) : null}
          </Panel>

          <Panel>
            <SectionHeader eyebrow="Detail" title="Condition and description" />
            <p className="mt-4 whitespace-pre-line text-[0.875rem] leading-relaxed text-fg-muted">
              {book.description}
            </p>
            <Divider />
            <dl>
              <KeyValue label="Edition">{book.edition}</KeyValue>
              <KeyValue label="Publisher">{book.publisher}</KeyValue>
              <KeyValue label="ISBN">{book.isbn}</KeyValue>
              <KeyValue label="Pages">{book.pages > 0 ? book.pages : 'Not stated'}</KeyValue>
              <KeyValue label="Language">{book.language}</KeyValue>
              <KeyValue label="Course codes">
                {book.courseCodes.length > 0 ? (
                  <span className="flex flex-wrap justify-end gap-1.5">
                    {book.courseCodes.map((code) => (
                      <Link
                        key={code}
                        to={`/academics/courses/${code}`}
                        className="numeric rounded-md border border-line px-1.5 py-0.5 text-[0.6875rem] text-fg-muted hover:text-accent"
                      >
                        {code}
                      </Link>
                    ))}
                  </span>
                ) : (
                  'General reading'
                )}
              </KeyValue>
              <KeyValue label="Tags">
                <span className="flex flex-wrap justify-end gap-1.5">
                  {book.tags.map((tag) => (
                    <span key={tag} className="text-[0.6875rem] text-fg-subtle">
                      #{tag}
                    </span>
                  ))}
                </span>
              </KeyValue>
            </dl>
          </Panel>

          <Panel>
            <SectionHeader eyebrow="Collection" title="Where and how" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-surface/45 p-3.5">
                <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-fg">
                  <MapPin className="size-4 text-accent" aria-hidden="true" />
                  {book.location}
                </p>
                <p className="mt-1.5 text-xs text-fg-muted">
                  Agree a time in messages. Public contact details are deliberately hidden by default.
                </p>
              </div>
              <div className="rounded-xl border border-line bg-surface/45 p-3.5">
                <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-fg">
                  {book.fulfilment.includes('delivery') ? (
                    <Truck className="size-4 text-accent" aria-hidden="true" />
                  ) : (
                    <Store className="size-4 text-accent" aria-hidden="true" />
                  )}
                  {book.fulfilment.includes('delivery') ? 'Pickup or delivery' : 'Pickup only'}
                </p>
                <p className="mt-1.5 text-xs text-fg-muted">
                  {book.fulfilment.includes('delivery')
                    ? 'The seller offers to deliver within campus. Agree the handover in messages.'
                    : 'Collect from the stated location. Nothing is shipped off campus.'}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.6875rem] text-fg-subtle">
              <span className="flex items-center gap-1.5">
                <CalendarClock className="size-3" aria-hidden="true" />
                Listed {relativeTime(book.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="size-3" aria-hidden="true" />
                Seller-supplied information
              </span>
            </div>
          </Panel>

          <Panel strength="quiet">
            <p className="flex items-start gap-2.5 text-xs leading-relaxed text-fg-muted">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
              <span>
                Stay safe: meet in a public campus location, inspect the book before paying, and never transfer money
                in advance. CampusOS does not hold payments, guarantee condition or mediate disputes.
                {' '}
                <span className="text-fg-subtle">Reports you file are stored locally in demonstration mode.</span>
              </span>
            </p>
          </Panel>
        </div>
      </div>

      {related.length > 0 ? (
        <Panel>
          <SectionHeader
            eyebrow="More from this shelf"
            title={`Other ${book.subject} listings`}
            description="Similar subject or shared course codes with the copy you are viewing."
          />
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((entry) => (
              <BookCard key={entry.id} book={entry} />
            ))}
          </div>
        </Panel>
      ) : null}

      <Modal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title={`Message ${book.seller.name}`}
        description="Ask about condition, edition, price or a collection time. Contact details stay private until the seller chooses to share them."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setContactOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={sendEnquiry} icon={<Check className="size-4" />}>
              Send message
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-surface/50 px-3.5 py-3">
            <p className="caps">About</p>
            <p className="mt-1.5 text-[0.8125rem] text-fg">
              {book.title} · {formatMoney(book.price)}
            </p>
          </div>
          <Field
            label="Your message"
            hint="Mention what you would like to confirm and when you could collect."
            error={error}
            required
          >
            <TextArea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              autoFocus
              placeholder={`Hello ${book.seller.name.split(' ')[0]}, is the ${book.edition.toLowerCase()} copy still available? Could I collect from ${book.location} this week?`}
            />
          </Field>
          <InlineNote tone="neutral">
            {state.threads.length > 0
              ? 'Your existing conversations stay in Messages, in the same thread if you have written before.'
              : 'This starts your first conversation. It will appear in Messages.'}
          </InlineNote>
        </div>
      </Modal>
    </div>
  );
}
