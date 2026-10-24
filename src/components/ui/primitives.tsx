import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Database, Info, LoaderCircle, Search, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { initialsOf, percent } from '@/lib/format';
import { stableHash } from '@/lib/ids';

/* ================================================================== surfaces */

type SurfaceStrength = 'panel' | 'float' | 'modal' | 'solid' | 'quiet';

const SURFACE_CLASS: Record<SurfaceStrength, string> = {
  panel: 'glass-surface glass-panel',
  float: 'glass-surface glass-float',
  modal: 'glass-surface glass-modal',
  solid: 'bg-raised border border-line',
  quiet: 'bg-surface/60 border border-line',
};

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  strength?: SurfaceStrength;
  interactive?: boolean;
  padded?: boolean;
}

export function Panel({
  strength = 'panel',
  interactive = false,
  padded = true,
  className,
  children,
  ...rest
}: PanelProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border border-line',
        SURFACE_CLASS[strength],
        padded && 'p-5 sm:p-6',
        interactive && 'lift cursor-pointer',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** A surface with an eyebrow, title and optional action, used to open sections. */
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="caps mb-2">{eyebrow}</p> : null}
        <h2 className="display text-[1.5rem] text-fg sm:text-[1.75rem]">{title}</h2>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-fg-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 sm:mb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          {eyebrow ? <p className="caps mb-3">{eyebrow}</p> : null}
          <h1 className="display text-[2rem] leading-[1.05] text-fg sm:text-[2.6rem] lg:text-[3rem]">{title}</h1>
          {description ? (
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-fg-muted">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </header>
  );
}

/* =================================================================== controls */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'quiet' | 'danger' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-ink hover:bg-accent-hover shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_10px_24px_-14px_rgba(0,0,0,0.7)]',
  secondary:
    'glass-surface glass-panel border border-line text-fg hover:border-line-strong hover:bg-surface/70',
  ghost: 'text-fg-muted hover:text-fg hover:bg-surface/60 border border-transparent',
  quiet: 'bg-surface/70 border border-line text-fg-muted hover:text-fg hover:border-line-strong',
  danger: 'bg-danger-soft text-danger border border-danger/35 hover:border-danger/60',
  link: 'text-accent hover:text-accent-hover underline-offset-4 hover:underline px-0',
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[0.8125rem] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-[0.9375rem] gap-2 rounded-xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  trailingIcon,
  fullWidth,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'relative inline-flex select-none items-center justify-center font-medium transition-all duration-200 ease-out',
        'disabled:pointer-events-none disabled:opacity-45',
        BUTTON_SIZE[size],
        BUTTON_VARIANT[variant],
        fullWidth && 'w-full',
        variant !== 'link' && 'active:translate-y-px',
        className,
      )}
      {...rest}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
      {trailingIcon}
    </button>
  );
}

export function LinkButton({
  to,
  variant = 'secondary',
  size = 'md',
  icon,
  trailingIcon = <ArrowRight className="size-4" aria-hidden="true" />,
  className,
  children,
  ...rest
}: {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
  children: ReactNode;
} & Omit<React.ComponentProps<typeof Link>, 'to' | 'className' | 'children'>) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex select-none items-center justify-center font-medium transition-all duration-200 ease-out',
        BUTTON_SIZE[size],
        BUTTON_VARIANT[variant],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
      {trailingIcon}
    </Link>
  );
}

export function IconButton({
  label,
  size = 'md',
  variant = 'ghost',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  size?: 'sm' | 'md';
  variant?: ButtonVariant;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-lg border transition-all duration-200',
        size === 'sm' ? 'size-8' : 'size-10',
        variant === 'ghost'
          ? 'border-transparent text-fg-muted hover:border-line hover:bg-surface/70 hover:text-fg'
          : BUTTON_VARIANT[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ====================================================================== chips */

export type Tone = 'neutral' | 'accent' | 'teal' | 'danger' | 'warn' | 'ok' | 'muted';

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'border-line bg-surface/70 text-fg-muted',
  accent: 'border-accent/40 bg-accent-soft text-accent',
  teal: 'border-teal/35 bg-teal-soft text-teal',
  danger: 'border-danger/35 bg-danger-soft text-danger',
  warn: 'border-warn/35 bg-warn-soft text-warn',
  ok: 'border-ok/35 bg-ok-soft text-ok',
  muted: 'border-transparent bg-surface/50 text-fg-subtle',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
  icon,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[0.6875rem] font-medium tracking-[0.02em]',
        TONE_CLASS[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Distinguishes sample content from verified live information. Never hidden. */
export function DataOriginTag({ origin, className }: { origin: string; className?: string }) {
  const label =
    origin === 'demo'
      ? 'Sample data'
      : origin === 'user'
        ? 'Your content'
        : origin === 'institution'
          ? 'Published here'
          : 'Partner source';
  const tone: Tone = origin === 'demo' ? 'muted' : origin === 'user' ? 'teal' : 'neutral';
  return (
    <Badge tone={tone} className={className} icon={<Database className="size-3" aria-hidden="true" />}>
      {label}
    </Badge>
  );
}

export function StatusDot({ tone = 'neutral', pulse = false }: { tone?: Tone; pulse?: boolean }) {
  const colour =
    tone === 'ok'
      ? 'bg-ok'
      : tone === 'danger'
        ? 'bg-danger'
        : tone === 'warn'
          ? 'bg-warn'
          : tone === 'teal'
            ? 'bg-teal'
            : tone === 'accent'
              ? 'bg-accent'
              : 'bg-fg-subtle';
  return (
    <span className="relative inline-flex size-2 shrink-0" aria-hidden="true">
      {pulse ? <span className={cn('absolute inset-0 rounded-full opacity-45', colour)} /> : null}
      <span className={cn('relative m-auto size-2 rounded-full', colour)} />
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="numeric inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-surface/80 px-1.5 text-[0.6875rem] text-fg-subtle">
      {children}
    </kbd>
  );
}

/* ==================================================================== display */

export function Avatar({
  name,
  seed,
  size = 'md',
  className,
}: {
  name: string;
  seed?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const dimension =
    size === 'xs' ? 'size-6 text-[0.5625rem]' : size === 'sm' ? 'size-8 text-[0.6875rem]' : size === 'lg' ? 'size-12 text-sm' : size === 'xl' ? 'size-16 text-lg' : 'size-10 text-xs';
  const hue = stableHash(seed ?? name) % 360;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-line font-semibold tracking-wide text-fg',
        dimension,
        className,
      )}
      style={{
        background: `linear-gradient(150deg, hsl(${hue} 32% 26%), hsl(${(hue + 48) % 360} 28% 16%))`,
      }}
    >
      {initialsOf(name)}
    </span>
  );
}

export function Skeleton({ className, rounded = 'rounded-lg' }: { className?: string; rounded?: string }) {
  return <div className={cn('skeleton', rounded, className)} aria-hidden="true" />;
}

export function Meter({
  value,
  max = 100,
  tone = 'accent',
  label,
  showValue = false,
  className,
}: {
  value: number;
  max?: number;
  tone?: Tone;
  label?: string;
  showValue?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, percent(value, max)));
  const fill =
    tone === 'danger'
      ? 'bg-danger'
      : tone === 'warn'
        ? 'bg-warn'
        : tone === 'ok'
          ? 'bg-ok'
          : tone === 'teal'
            ? 'bg-teal'
            : 'bg-accent';
  return (
    <div className={className}>
      {label || showValue ? (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          {label ? <span className="text-xs text-fg-muted">{label}</span> : null}
          {showValue ? <span className="numeric text-xs text-fg-subtle">{pct}%</span> : null}
        </div>
      ) : null}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface/80"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        <div className={cn('h-full rounded-full transition-[width] duration-500 ease-out', fill)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('hairline my-5', className)} role="separator" />;
}

export function InlineNote({
  tone = 'neutral',
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const Icon = tone === 'warn' || tone === 'danger' ? TriangleAlert : Info;
  return (
    <div
      className={cn(
        'flex gap-3 rounded-xl border px-3.5 py-3 text-[0.8125rem] leading-relaxed',
        TONE_CLASS[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title ? <p className="mb-0.5 font-medium text-fg">{title}</p> : null}
        <div className="text-fg-muted">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-12 text-center',
        className,
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-line bg-surface/70 text-fg-subtle">
        {icon ?? <Search className="size-5" aria-hidden="true" />}
      </div>
      <h3 className="text-[0.9375rem] font-medium text-fg">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-fg-muted">{description}</p>
      {action ? <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
    </div>
  );
}

/* ====================================================================== layout */

export function StatTile({
  label,
  value,
  hint,
  tone = 'neutral',
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-line bg-surface/45 px-3.5 py-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="caps">{label}</p>
        {icon ? <span className={cn('text-fg-subtle', tone === 'accent' && 'text-accent', tone === 'danger' && 'text-danger')}>{icon}</span> : null}
      </div>
      <p className="numeric mt-2 text-[1.375rem] leading-none text-fg">{value}</p>
      {hint ? <p className="mt-1.5 text-xs text-fg-subtle">{hint}</p> : null}
    </div>
  );
}

export function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
      <dt className="text-xs text-fg-subtle">{label}</dt>
      <dd className="text-right text-[0.8125rem] text-fg">{children}</dd>
    </div>
  );
}

export function ProgressSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                'numeric flex size-6 items-center justify-center rounded-full border text-[0.6875rem]',
                done && 'border-teal/45 bg-teal-soft text-teal',
                active && 'border-accent/50 bg-accent-soft text-accent',
                !done && !active && 'border-line text-fg-subtle',
              )}
            >
              {index + 1}
            </span>
            <span className={cn('text-xs', active ? 'text-fg' : 'text-fg-subtle')}>{step}</span>
            {index < steps.length - 1 ? <span className="mx-1 h-px w-4 bg-line-strong" aria-hidden="true" /> : null}
          </li>
        );
      })}
    </ol>
  );
}
