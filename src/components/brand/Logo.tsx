import { cn } from '@/lib/cn';

/**
 * CampusOS mark — a layered "C" that frames three rising buildings connected by
 * a common baseline. Geometric, single-weight, legible down to 20px.
 */
export function LogoMark({
  size = 28,
  className,
  animated = false,
}: {
  size?: number;
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="CampusOS"
      className={cn('shrink-0', className)}
    >
      <g
        className={animated ? 'origin-center motion-safe:animate-[campus-mark_900ms_cubic-bezier(0.22,1,0.36,1)_1]' : undefined}
      >
        <path
          d="M22.88 5.42A12.5 12.5 0 1 0 22.88 26.58"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M21.16 9.23A9 9 0 1 0 21.16 22.77"
          stroke="var(--accent)"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.5"
        />
        <g stroke="var(--teal)" strokeWidth="1.8" strokeLinecap="round">
          <path d="M19.8 20.4v-4.2" />
          <path d="M22.7 20.4V11.6" />
          <path d="M25.6 20.4v-2.6" />
        </g>
        <path d="M18.4 21.6h8.6" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
      </g>
    </svg>
  );
}

export function Wordmark({
  className,
  compact = false,
  size = 'md',
}: {
  className?: string;
  compact?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dimension = size === 'sm' ? 22 : size === 'lg' ? 34 : 28;
  const text = size === 'sm' ? 'text-[1.0625rem]' : size === 'lg' ? 'text-[1.5rem]' : 'text-[1.25rem]';
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={dimension} />
      {!compact ? (
        <span className={text}>
          <span className="font-medium tracking-[-0.02em] text-fg">Campus</span>
          <span className="display text-accent">OS</span>
        </span>
      ) : null}
    </span>
  );
}

export function BrandLockup({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-4 text-center', className)}>
      <LogoMark size={54} />
      <div>
        <p className="text-[1.75rem] leading-none">
          <span className="font-medium tracking-[-0.02em] text-fg">Campus</span>
          <span className="display text-accent">OS</span>
        </p>
        <p className="mt-2 text-[0.8125rem] tracking-[0.02em] text-fg-muted">
          Your entire campus. One intelligent space.
        </p>
      </div>
    </div>
  );
}
