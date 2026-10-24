import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Info, TriangleAlert, X } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { BOOK_CONDITIONS, BOOK_SUBJECTS, TRANSACTION_LABELS } from '@/data/books';
import { COURSES } from '@/data/academics';
import { formatMoney } from '@/lib/format';
import { toThumbnail, validateImage, MAX_IMAGE_BYTES } from '@/lib/images';
import { cn } from '@/lib/cn';
import {
  Badge,
  Button,
  Divider,
  InlineNote,
  Panel,
  SectionHeader,
} from '@/components/ui/primitives';
import { Checkbox, Field, OptionCards, Select, TextArea, TextInput } from '@/components/ui/fields';
import { SmartImage } from '@/components/ui/SmartImage';
import { ConfirmDialog } from '@/components/ui/overlays';
import { useToast } from '@/components/ui/Toast';
import type { BookCondition, TransactionType } from '@/lib/types';

interface Draft {
  title: string;
  author: string;
  subject: string;
  edition: string;
  isbn: string;
  publisher: string;
  pages: string;
  condition: BookCondition;
  transaction: TransactionType;
  price: string;
  description: string;
  courseCodes: string[];
  location: string;
  pickup: boolean;
  delivery: boolean;
  coverImage: string | null;
  tags: string;
}

const EMPTY: Draft = {
  title: '',
  author: '',
  subject: BOOK_SUBJECTS[0],
  edition: '',
  isbn: '',
  publisher: '',
  pages: '',
  condition: 'good',
  transaction: 'sale',
  price: '',
  description: '',
  courseCodes: [],
  location: '',
  pickup: true,
  delivery: false,
  coverImage: null,
  tags: '',
};

export default function ListingFormPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { books, createListing, updateListing, removeListing } = useApp();
  const existing = bookId ? books.find((book) => book.id === bookId) : undefined;
  const fileInput = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [draft, setDraft] = useState<Draft>(() =>
    existing
      ? {
          title: existing.title,
          author: existing.author,
          subject: existing.subject,
          edition: existing.edition,
          isbn: existing.isbn === 'Not provided' ? '' : existing.isbn,
          publisher: existing.publisher === 'Not stated' ? '' : existing.publisher,
          pages: existing.pages > 0 ? String(existing.pages) : '',
          condition: existing.condition,
          transaction: existing.transaction,
          price: existing.price.amount > 0 ? String(existing.price.amount) : '',
          description: existing.description,
          courseCodes: existing.courseCodes,
          location: existing.location,
          pickup: existing.fulfilment.includes('pickup'),
          delivery: existing.fulfilment.includes('delivery'),
          coverImage: existing.coverImage || null,
          tags: existing.tags.join(', '),
        }
      : EMPTY,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageError, setImageError] = useState<string | null>(null);

  const isEditing = Boolean(existing);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key as string]) return current;
      const { [key as string]: _removed, ...rest } = current;
      return rest;
    });
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (draft.title.trim().length < 3) next.title = 'Give the listing a clear title.';
    if (draft.author.trim().length < 2) next.author = 'Add the author or compiler.';
    if (draft.description.trim().length < 20) next.description = 'Describe the condition in at least a sentence.';
    if (draft.transaction === 'sale' && (!draft.price || Number(draft.price) <= 0)) {
      next.price = 'Set a price above zero, or choose another transaction type.';
    }
    if (!draft.pickup && !draft.delivery) next.fulfilment = 'Choose at least one handover method.';
    if (draft.location.trim().length < 3) next.location = 'Say where the book can be collected.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onPickImage(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const check = validateImage(file);
    if (!check.ok) {
      setImageError(check.error);
      return;
    }
    try {
      const thumbnail = await toThumbnail(file);
      setDraft((current) => ({ ...current, coverImage: thumbnail }));
      setImageError(null);
    } catch {
      setImageError('That image could not be processed. Try a different file.');
    }
  }

  function save() {
    if (!validate()) {
      toast.error('Check the highlighted fields', 'Some details are missing or invalid.');
      return;
    }
    const payload = {
      title: draft.title,
      author: draft.author,
      subject: draft.subject,
      edition: draft.edition,
      isbn: draft.isbn,
      publisher: draft.publisher,
      condition: draft.condition,
      transaction: draft.transaction,
      price: Number(draft.price) || 0,
      description: draft.description,
      courseCodes: draft.courseCodes,
      location: draft.location,
      fulfilment: [
        ...(draft.pickup ? (['pickup'] as const) : []),
        ...(draft.delivery ? (['delivery'] as const) : []),
      ],
      coverImage: draft.coverImage,
      pages: Number(draft.pages) || 0,
      tags: draft.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    if (isEditing && existing) {
      updateListing(existing.id, {
        ...payload,
        price: { amount: payload.price, currency: 'INR' },
        fulfilment: payload.fulfilment as ('pickup' | 'delivery')[],
        coverImage: payload.coverImage ?? '',
      });
      toast.success('Listing updated', 'Changes are visible immediately.');
      navigate('/books/my-listings');
      return;
    }

    const result = createListing({ ...payload, coverImage: payload.coverImage });
    if (!result.ok || !result.value) {
      toast.error('Could not create the listing', result.error);
      return;
    }
    toast.success('Listing created', 'New listings are held for moderation before they appear in search.');
    navigate('/books/my-listings');
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

      <SectionHeader
        eyebrow={isEditing ? 'Edit listing' : 'New listing'}
        title={isEditing ? 'Update your listing' : 'List a book for your campus'}
        description="Describe the copy honestly. Condition, edition and price drive most of the decisions buyers make — and moderated listings stay hidden until they are reviewed."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-5">
          <Panel>
            <p className="caps">The book</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Title" required error={errors.title} htmlFor="lf-title" className="sm:col-span-2">
                <TextInput
                  id="lf-title"
                  value={draft.title}
                  invalid={Boolean(errors.title)}
                  onChange={(event) => update('title', event.target.value)}
                  placeholder="Introduction to Algorithms"
                />
              </Field>
              <Field label="Author or compiler" required error={errors.author} htmlFor="lf-author">
                <TextInput
                  id="lf-author"
                  value={draft.author}
                  invalid={Boolean(errors.author)}
                  onChange={(event) => update('author', event.target.value)}
                  placeholder="Cormen, Leiserson, Rivest & Stein"
                />
              </Field>
              <Field label="Subject" htmlFor="lf-subject">
                <Select id="lf-subject" value={draft.subject} onChange={(event) => update('subject', event.target.value)}>
                  {BOOK_SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Edition" htmlFor="lf-edition">
                <TextInput
                  id="lf-edition"
                  value={draft.edition}
                  onChange={(event) => update('edition', event.target.value)}
                  placeholder="4th edition"
                />
              </Field>
              <Field label="ISBN" htmlFor="lf-isbn" hint="Optional, but it makes search much better.">
                <TextInput
                  id="lf-isbn"
                  value={draft.isbn}
                  onChange={(event) => update('isbn', event.target.value)}
                  placeholder="978-0262046305"
                />
              </Field>
              <Field label="Publisher" htmlFor="lf-publisher">
                <TextInput
                  id="lf-publisher"
                  value={draft.publisher}
                  onChange={(event) => update('publisher', event.target.value)}
                  placeholder="MIT Press"
                />
              </Field>
              <Field label="Pages" htmlFor="lf-pages">
                <TextInput
                  id="lf-pages"
                  type="number"
                  min={1}
                  value={draft.pages}
                  onChange={(event) => update('pages', event.target.value)}
                  placeholder="1312"
                />
              </Field>
            </div>

            <div className="mt-5">
              <Field label="Course codes" hint="Link the book to the courses it serves so students find it by module code.">
                <div className="flex flex-wrap gap-1.5">
                  {COURSES.map((course) => {
                    const selected = draft.courseCodes.includes(course.code);
                    return (
                      <button
                        key={course.code}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          update(
                            'courseCodes',
                            selected
                              ? draft.courseCodes.filter((code) => code !== course.code)
                              : [...draft.courseCodes, course.code],
                          )
                        }
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs transition-colors',
                          selected
                            ? 'border-accent/50 bg-accent-soft text-accent'
                            : 'border-line bg-surface/50 text-fg-muted hover:border-line-strong hover:text-fg',
                        )}
                      >
                        <span className="numeric">{course.code}</span>
                        <span className="ml-1.5 text-fg-subtle">{course.title}</span>
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          </Panel>

          <Panel>
            <p className="caps">Condition and terms</p>
            <div className="mt-4 space-y-5">
              <Field label="Condition" required>
                <OptionCards
                  name="Condition"
                  columns={2}
                  value={draft.condition}
                  onChange={(value) => update('condition', value)}
                  options={BOOK_CONDITIONS.map((condition) => ({
                    value: condition.value,
                    label: condition.label,
                    hint: condition.hint,
                  }))}
                />
              </Field>

              <Field label="What kind of listing is this?" required>
                <OptionCards
                  name="Transaction"
                  columns={2}
                  value={draft.transaction}
                  onChange={(value) => update('transaction', value)}
                  options={(['sale', 'borrow', 'exchange', 'free'] as TransactionType[]).map((transaction) => ({
                    value: transaction,
                    label: TRANSACTION_LABELS[transaction],
                    hint:
                      transaction === 'sale'
                        ? 'You keep the price you set'
                        : transaction === 'borrow'
                          ? 'Lent for an agreed period'
                          : transaction === 'exchange'
                            ? 'Swapped for another title'
                            : 'Given away at no cost',
                  }))}
                />
              </Field>

              {draft.transaction === 'sale' ? (
                <Field
                  label="Price (₹)"
                  required
                  error={errors.price}
                  htmlFor="lf-price"
                  hint="Nothing is charged by CampusOS. Buyers pay you directly on collection."
                >
                  <TextInput
                    id="lf-price"
                    type="number"
                    min={0}
                    value={draft.price}
                    invalid={Boolean(errors.price)}
                    onChange={(event) => update('price', event.target.value)}
                    placeholder="1450"
                  />
                </Field>
              ) : (
                <InlineNote tone="neutral">
                  {TRANSACTION_LABELS[draft.transaction]} listings do not carry a price. Note any conditions — a return
                  date for loans, or what you would like in exchange — in the description.
                </InlineNote>
              )}

              <Field
                label="Description"
                required
                error={errors.description}
                htmlFor="lf-description"
                hint="Mention highlighting, annotations, water damage, missing pages and anything else a buyer would want to know."
              >
                <TextArea
                  id="lf-description"
                  value={draft.description}
                  invalid={Boolean(errors.description)}
                  onChange={(event) => update('description', event.target.value)}
                  rows={5}
                  placeholder="Spine intact, a few pencil annotations in the graph chapters. No missing pages, no water damage."
                />
              </Field>

              <Field label="Tags" htmlFor="lf-tags" hint="Comma separated. Used only for search.">
                <TextInput
                  id="lf-tags"
                  value={draft.tags}
                  onChange={(event) => update('tags', event.target.value)}
                  placeholder="algorithms, CLRS, core reference"
                />
              </Field>
            </div>
          </Panel>

          <Panel>
            <p className="caps">Handover</p>
            <div className="mt-4 space-y-4">
              <Field label="Pickup point" required error={errors.location} htmlFor="lf-location">
                <TextInput
                  id="lf-location"
                  value={draft.location}
                  invalid={Boolean(errors.location)}
                  onChange={(event) => update('location', event.target.value)}
                  placeholder="North Campus — near Gate 2"
                />
              </Field>
              <Field label="How can it be collected?" error={errors.fulfilment}>
                <div className="space-y-2.5">
                  <Checkbox
                    checked={draft.pickup}
                    onChange={(checked) => update('pickup', checked)}
                    label="Buyer collects"
                    hint="Meet at a public campus location."
                  />
                  <Checkbox
                    checked={draft.delivery}
                    onChange={(checked) => update('delivery', checked)}
                    label="Seller delivers within campus"
                    hint="Agree a time in messages. Nothing is shipped off campus."
                  />
                </div>
              </Field>
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel>
            <p className="caps">Cover photograph</p>
            <div className="mt-4">
              {draft.coverImage ? (
                <div className="relative">
                  <SmartImage
                    src={draft.coverImage}
                    alt="Listing cover preview"
                    ratio="3 / 4"
                    wrapperClassName="rounded-xl border border-line"
                    sizes="320px"
                  />
                  <button
                    type="button"
                    onClick={() => update('coverImage', null)}
                    aria-label="Remove cover photo"
                    className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-lg border border-line bg-canvas/80 text-fg-muted transition-colors hover:text-danger"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line py-12 text-fg-subtle transition-colors hover:border-line-strong hover:text-fg-muted"
                >
                  <ImagePlus className="size-5" aria-hidden="true" />
                  <span className="text-xs">Add a photograph</span>
                  <span className="text-[0.6875rem]">
                    JPEG, PNG or WebP · under {Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB
                  </span>
                </button>
              )}
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => onPickImage(event.target.files)}
              />
              {imageError ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-danger" role="alert">
                  <TriangleAlert className="size-3.5" aria-hidden="true" />
                  {imageError}
                </p>
              ) : null}
              {draft.coverImage ? (
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  className="mt-2"
                  onClick={() => fileInput.current?.click()}
                >
                  Replace image
                </Button>
              ) : null}
            </div>
            <p className="mt-3 text-[0.6875rem] leading-relaxed text-fg-subtle">
              Images are downscaled in your browser. Nothing is uploaded to a server, because no storage service is
              connected.
            </p>
          </Panel>

          <Panel strength="quiet">
            <p className="caps">Preview</p>
            <div className="mt-3 flex gap-3">
              <div className="w-16 shrink-0">
                {draft.coverImage ? (
                  <SmartImage src={draft.coverImage} alt="" ratio="3 / 4" wrapperClassName="rounded-lg border border-line" />
                ) : (
                  <div
                    className="rounded-lg border border-line"
                    style={{ aspectRatio: '3 / 4', background: 'linear-gradient(150deg, var(--raised), var(--sunken))' }}
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-[0.8125rem] font-medium text-fg">
                  {draft.title || 'Untitled listing'}
                </p>
                <p className="mt-0.5 line-clamp-1 text-xs text-fg-subtle">{draft.author || 'Author not stated'}</p>
                <p className="numeric mt-1.5 text-xs text-fg">
                  {draft.transaction === 'sale'
                    ? formatMoney({ amount: Number(draft.price) || 0, currency: 'INR' })
                    : TRANSACTION_LABELS[draft.transaction]}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="muted">{draft.subject}</Badge>
                  {draft.courseCodes.slice(0, 2).map((code) => (
                    <Badge key={code} tone="accent">
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel strength="quiet">
            <p className="flex items-start gap-2 text-[0.6875rem] leading-relaxed text-fg-subtle">
              <Info className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
              New and edited listings enter moderation. They stay hidden from search until reviewed, and your contact
              details are never published.
            </p>
          </Panel>

          <div className="flex flex-col gap-2">
            <Button variant="primary" size="lg" fullWidth onClick={save}>
              {isEditing ? 'Save changes' : 'Publish listing'}
            </Button>
            <Link
              to="/books/my-listings"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-line text-sm text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              Cancel
            </Link>
            {isEditing ? (
              <Button variant="danger" fullWidth onClick={() => setConfirmDelete(true)}>
                Remove listing
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <Divider />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!existing) return;
          removeListing(existing.id);
          toast.success('Listing removed', 'It is no longer visible on the shelf.');
          navigate('/books/my-listings');
        }}
        title="Remove this listing?"
        description="Removing a listing takes it off the shelf immediately. This cannot be undone."
        confirmLabel="Remove listing"
        destructive
      />
    </div>
  );
}
