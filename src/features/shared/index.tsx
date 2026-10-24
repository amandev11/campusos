import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BookmarkCheck, Cable, Flag, ShieldAlert } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { Badge, Button, InlineNote, Panel, type Tone } from '@/components/ui/primitives';
import { ConfirmDialog, Modal } from '@/components/ui/overlays';
import { Field, OptionCards, TextArea } from '@/components/ui/fields';
import { integrationById } from '@/lib/backend';
import type { SavedKind } from '@/lib/types';

/* ============================================================== save action */

export function SaveButton({
  kind,
  refId,
  title,
  subtitle,
  href,
  size = 'md',
  variant = 'quiet',
  withLabel = true,
  className,
}: {
  kind: SavedKind;
  refId: string;
  title: string;
  subtitle: string;
  href: string;
  size?: 'sm' | 'md';
  variant?: 'primary' | 'secondary' | 'ghost' | 'quiet';
  withLabel?: boolean;
  className?: string;
}) {
  const { isSaved, toggleSaved } = useApp();
  const toast = useToast();
  const saved = isSaved(refId);

  return (
    <Button
      variant={saved ? 'primary' : variant}
      size={size}
      className={className}
      aria-pressed={saved}
      icon={saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
      onClick={() => {
        toggleSaved({ kind, refId, title, subtitle, href });
        toast[saved ? 'info' : 'success'](saved ? 'Removed from saved items' : 'Saved', title);
      }}
    >
      {withLabel ? (saved ? 'Saved' : 'Save') : null}
    </Button>
  );
}

/* ================================================================ link rows */

/**
 * A link that stretches across its nearest positioned ancestor, so an entire
 * card or row can be clickable without nesting anchors — a nested `<a>` is
 * invalid HTML and breaks keyboard and screen-reader navigation.
 *
 * Put this inside a `relative` container, and give sibling interactive elements
 * `relative z-10` so they keep working above the invisible overlay.
 */
export function StretchedLink({
  to,
  children,
  className,
  label,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      className={cn("block rounded-sm after:absolute after:inset-0 after:content-['']", className)}
    >
      {children}
    </Link>
  );
}

/* ================================================================= reporting */

const REPORT_REASONS = [
  { value: 'misleading', label: 'Misleading information', hint: 'Claims that do not match the source' },
  { value: 'unsafe', label: 'Safety concern', hint: 'Something that could put a student at risk' },
  { value: 'spam', label: 'Spam or duplicate', hint: 'Repeated or unrelated posting' },
  { value: 'privacy', label: 'Privacy', hint: 'Exposes personal details it should not' },
  { value: 'other', label: 'Something else', hint: 'Describe it in your own words' },
] as const;

export function ReportDialog({
  open,
  onClose,
  kind,
  refId,
  refLabel,
}: {
  open: boolean;
  onClose: () => void;
  kind: SavedKind | 'message' | 'seller';
  refId: string;
  refLabel: string;
}) {
  const { addReport } = useApp();
  const toast = useToast();
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]['value']>('misleading');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (detail.trim().length < 10) {
      setError('Add a short explanation so moderators can act on it.');
      return;
    }
    addReport({ kind, refId, refLabel, reason, detail: detail.trim() });
    toast.success('Report submitted', 'Moderators review reports in this browser only in demonstration mode.');
    setDetail('');
    setError(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Report this content"
      description="Reports go to the moderation queue. In demonstration mode the queue is stored locally and nothing is sent anywhere."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} icon={<Flag className="size-4" />}>
            Submit report
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-line bg-surface/50 px-3.5 py-3">
          <p className="caps">Reporting</p>
          <p className="mt-1.5 text-[0.8125rem] text-fg">{refLabel}</p>
        </div>
        <Field label="Reason">
          <OptionCards
            name="Report reason"
            columns={1}
            value={reason}
            onChange={setReason}
            options={REPORT_REASONS.map((option) => ({ ...option }))}
          />
        </Field>
        <Field label="What happened?" hint="Be specific — which claim or element is the problem?" error={error} required>
          <TextArea
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            placeholder="Describe what is inaccurate, unsafe or otherwise concerning."
          />
        </Field>
      </div>
    </Modal>
  );
}

export function ReportButton({
  kind,
  refId,
  refLabel,
  size = 'sm',
  className,
}: {
  kind: SavedKind | 'message' | 'seller';
  refId: string;
  refLabel: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size={size} className={className} icon={<Flag className="size-3.5" />} onClick={() => setOpen(true)}>
        Report
      </Button>
      <ReportDialog open={open} onClose={() => setOpen(false)} kind={kind} refId={refId} refLabel={refLabel} />
    </>
  );
}

/* ============================================================ module heroes */

export function ModuleHero({
  eyebrow,
  title,
  description,
  meta,
  actions,
  aside,
  tone = 'accent',
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <Panel strength="float" padded={false} className={cn('sheen overflow-hidden', className)}>
      <div className="grid gap-6 p-6 lg:grid-cols-[1.35fr_1fr] lg:gap-8 lg:p-8">
        <div className="min-w-0">
          <p className="caps">{eyebrow}</p>
          <h1 className="display mt-3 text-[2rem] leading-[1.06] text-fg sm:text-[2.5rem]">{title}</h1>
          <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-fg-muted">{description}</p>
          {meta ? <div className="mt-5 flex flex-wrap items-center gap-2">{meta}</div> : null}
          {actions ? <div className="mt-6 flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
        {aside ? (
          <div className="min-w-0 lg:border-l lg:border-line lg:pl-8">
            <span
              className={cn(
                'mb-3 block h-px w-16',
                tone === 'teal' ? 'bg-teal' : tone === 'warn' ? 'bg-warn' : 'bg-accent',
              )}
              aria-hidden="true"
            />
            {aside}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

/* ======================================================== integration status */

export function IntegrationNotice({
  integrationId,
  className,
  compact = false,
}: {
  integrationId: string;
  className?: string;
  compact?: boolean;
}) {
  const integration = integrationById(integrationId);
  if (!integration || integration.configured) return null;

  if (compact) {
    return (
      <Badge tone="warn" className={className} icon={<Cable className="size-3" aria-hidden="true" />}>
        Not connected
      </Badge>
    );
  }

  return (
    <InlineNote tone="warn" title={`${integration.name} is not connected`} className={className}>
      {integration.fallback}{' '}
      <span className="text-fg-subtle">
        Provide {integration.envVars.join(' and ')} to enable {integration.unlocks.length} additional capabilities.
      </span>
    </InlineNote>
  );
}

/** Explains, in place, why an operation cannot proceed. */
export function BlockedAction({
  title,
  reason,
  action,
  className,
}: {
  title: string;
  reason: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-line bg-surface/50 px-4 py-3.5', className)}>
      <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-fg">
        <ShieldAlert className="size-4 text-warn" aria-hidden="true" />
        {title}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{reason}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

/* ============================================================== confirm flow */

export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description?: ReactNode;
    confirmLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
  }>({ open: false, title: '', onConfirm: () => {} });

  const confirm = (options: Omit<typeof state, 'open'>) => setState({ ...options, open: true });

  const dialog = (
    <ConfirmDialog
      open={state.open}
      onClose={() => setState((current) => ({ ...current, open: false }))}
      onConfirm={() => {
        state.onConfirm();
        setState((current) => ({ ...current, open: false }));
      }}
      title={state.title}
      description={state.description}
      confirmLabel={state.confirmLabel}
      destructive={state.destructive}
    />
  );

  return { confirm, dialog };
}
