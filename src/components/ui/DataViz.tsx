import { useId } from 'react';
import { cn } from '@/lib/cn';

/**
 * Compact visualisations only. Each answers a specific question — attendance
 * trend, capacity split, weekly load — rather than decorating a card.
 */

export function Sparkline({
  values,
  width = 120,
  height = 32,
  tone = 'accent',
  label,
  className,
}: {
  values: number[];
  width?: number;
  height?: number;
  tone?: 'accent' | 'teal' | 'danger';
  label: string;
  className?: string;
}) {
  const gradientId = useId();
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const stepX = width / (values.length - 1);
  const points = values.map((value, index) => {
    const x = index * stepX;
    const y = height - 3 - ((value - min) / span) * (height - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const stroke = tone === 'teal' ? 'var(--teal)' : tone === 'danger' ? 'var(--danger)' : 'var(--accent)';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={label}
      className={cn('overflow-visible', className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points.join(' ')} ${width},${height}`} fill={`url(#${gradientId})`} />
      <polyline points={points.join(' ')} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={Number(points[points.length - 1]!.split(',')[1])} r="2" fill={stroke} />
    </svg>
  );
}

export function DonutRing({
  segments,
  size = 132,
  thickness = 12,
  centerLabel,
  centerValue,
  ariaLabel,
  className,
}: {
  segments: { label: string; value: number; colour: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  ariaLabel: string;
  className?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={ariaLabel} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth={thickness}
        />
        {total > 0
          ? segments.map((segment) => {
              const length = (segment.value / total) * circumference;
              const dash = `${length} ${circumference - length}`;
              const element = (
                <circle
                  key={segment.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={segment.colour}
                  strokeWidth={thickness}
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += length;
              return element;
            })
          : null}
      </svg>
      {centerValue ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="numeric text-lg text-fg">{centerValue}</span>
          {centerLabel ? <span className="caps mt-0.5">{centerLabel}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

export function MiniBars({
  bars,
  max,
  height = 56,
  ariaLabel,
  className,
}: {
  bars: { label: string; value: number; highlight?: boolean }[];
  max?: number;
  height?: number;
  ariaLabel: string;
  className?: string;
}) {
  const peak = max ?? Math.max(...bars.map((bar) => bar.value), 1);
  return (
    <div className={cn('flex items-end gap-2', className)} role="img" aria-label={ariaLabel}>
      {bars.map((bar) => (
        <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex w-full items-end justify-center" style={{ height }}>
            <div
              className={cn('w-full max-w-8 rounded-t-md transition-[height] duration-500 ease-out', bar.highlight ? 'bg-accent' : 'bg-surface/90 border border-line')}
              style={{ height: `${Math.max(4, (bar.value / peak) * height)}px` }}
            />
          </div>
          <span className="truncate text-[0.625rem] uppercase tracking-wider text-fg-subtle">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Legend({ items, className }: { items: { label: string; colour: string; value?: string }[]; className?: string }) {
  return (
    <ul className={cn('space-y-2', className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-2 text-fg-muted">
            <span className="size-2 rounded-full" style={{ background: item.colour }} aria-hidden="true" />
            {item.label}
          </span>
          {item.value ? <span className="numeric text-fg">{item.value}</span> : null}
        </li>
      ))}
    </ul>
  );
}
