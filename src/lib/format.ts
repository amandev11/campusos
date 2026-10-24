import type { Money } from './types';

const CURRENCY_SYMBOL: Record<Money['currency'], string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  THB: '฿',
  AUD: 'A$',
};

export function formatMoney(money: Money, options: { compact?: boolean } = {}): string {
  const symbol = CURRENCY_SYMBOL[money.currency];
  const value = money.amount;
  if (value === 0) return 'Free';
  const formatted =
    options.compact && value >= 1000
      ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
      : value.toLocaleString('en-IN', { maximumFractionDigits: value % 1 === 0 ? 0 : 2 });
  return `${symbol}${formatted}`;
}

export function formatCompact(amount: number, currency: Money['currency']): string {
  return formatMoney({ amount, currency }, { compact: true });
}

export function formatRange(
  min: number,
  max: number,
  currency: Money['currency'],
  period: string,
): string {
  const per = period === 'total' ? '' : `/${period}`;
  if (min === 0 && max === 0) return 'Unpaid / volunteer';
  if (min === max) return `${formatCompact(min, currency)}${per}`;
  return `${formatCompact(min, currency)} – ${formatCompact(max, currency)}${per}`;
}

/** Parses an ISO string into a local Date without timezone surprises. */
export function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(value: string | Date, style: 'short' | 'medium' | 'long' = 'medium'): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '—';
  const opts: Intl.DateTimeFormatOptions =
    style === 'short'
      ? { day: 'numeric', month: 'short' }
      : style === 'long'
        ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
        : { day: 'numeric', month: 'short', year: 'numeric' };
  return new Intl.DateTimeFormat('en-GB', opts).format(date);
}

export function formatDateTime(value: string | Date): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)}`;
}

export function formatTime(value: string): string {
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h)) return value;
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m ?? 0).padStart(2, '0')}${suffix}`;
}

export function formatDayHeader(value: string | Date): string {
  const date = toDate(value);
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
}

export function relativeTime(value: string | Date, now: Date = new Date()): string {
  const date = toDate(value);
  const diff = date.getTime() - now.getTime();
  const abs = Math.abs(diff);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000000],
    ['month', 2592000000],
    ['week', 604800000],
    ['day', 86400000],
    ['hour', 3600000],
    ['minute', 60000],
  ];
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === 'minute') {
      return formatter.format(Math.round(diff / ms), unit);
    }
  }
  return 'just now';
}

/** "in 3 days" / "2 days overdue" — used for deadlines where direction matters. */
export function deadlineLabel(value: string | Date, now: Date = new Date()): {
  text: string;
  tone: 'ok' | 'warn' | 'danger' | 'neutral';
  days: number;
} {
  const date = toDate(value);
  const days = Math.ceil((date.getTime() - now.getTime()) / 86400000);
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, tone: 'danger', days };
  if (days === 0) return { text: 'Due today', tone: 'danger', days };
  if (days === 1) return { text: 'Due tomorrow', tone: 'warn', days };
  if (days <= 7) return { text: `Due in ${days} days`, tone: 'warn', days };
  return { text: `Due in ${days} days`, tone: 'neutral', days };
}

export function formatBytes(kb: number): string {
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function formatDurationWeeks(weeks: number): string {
  if (weeks < 1) return 'Flexible';
  if (weeks === 1) return '1 week';
  if (weeks < 5) return `${weeks} weeks`;
  if (weeks < 52) return `${Math.round(weeks / 4.345)} months`;
  const years = weeks / 52;
  return years % 1 === 0 ? `${years} years` : `${years.toFixed(1)} years`;
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function greetingFor(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return 'Working late';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfWeek(base: Date = new Date()): Date {
  const date = new Date(base);
  const day = date.getDay();
  const delta = day === 0 ? -6 : 1 - day; // Monday-first weeks
  date.setDate(date.getDate() + delta);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function pluralise(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function titleCase(value: string): string {
  return value
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
