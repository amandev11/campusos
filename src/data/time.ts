/**
 * Demo content uses relative dates so the product always looks current,
 * regardless of when it is opened.
 */

const BASE = new Date();

function shift(days: number, hours = 0, minutes = 0): Date {
  const date = new Date(BASE);
  date.setDate(date.getDate() + days);
  date.setHours(date.getHours() + hours, date.getMinutes() + minutes, 0, 0);
  return date;
}

function dateOnly(days: number): string {
  const date = shift(days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const rel = {
  /** ISO timestamp N days from now (negative = past). */
  days: (n: number, hours = 0) => shift(n, hours).toISOString(),
  /** ISO timestamp N hours from now. */
  hours: (n: number, minutes = 0) => shift(0, n, minutes).toISOString(),
  /** ISO timestamp N minutes from now. */
  minutes: (n: number) => shift(0, 0, n).toISOString(),
  /** YYYY-MM-DD N days from now. */
  date: dateOnly,
  /** YYYY-MM-DD for the weekday offset within the current week (0 = today). */
  weekday: (offset: number) => dateOnly(offset),
  today: BASE,
  nowIso: BASE.toISOString(),
};

export function todayAt(time: string, dayOffset = 0): string {
  const date = shift(dayOffset);
  const [h, m] = time.split(':').map(Number);
  date.setHours(h ?? 0, m ?? 0, 0, 0);
  return date.toISOString();
}
