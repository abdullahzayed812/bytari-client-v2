/**
 * Calendar-day / clock-time helpers that stay in the DEVICE's local time.
 *
 * Never derive a `YYYY-MM-DD` from `Date#toISOString()`: that is UTC, so in
 * Iraq (UTC+3) a day picked at local midnight becomes the previous day — a
 * "start date" of today then fails the server's not-in-the-past rule.
 */
const pad = (n: number): string => String(n).padStart(2, '0');

/** Local calendar day of `d` as `YYYY-MM-DD`. */
export function toLocalIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `YYYY-MM-DD` → a Date at LOCAL midnight of that day (`null` when malformed). */
export function fromLocalIsoDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Local clock time of `d` as 24h `HH:MM`. */
export function toLocalTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** A copy of `base` with its clock time set from `HH:MM` (`null` when malformed). */
export function withLocalTime(base: Date, hhmm: string): Date | null {
  const m = /^(\d{2}):(\d{2})/.exec(hhmm);
  if (!m) return null;
  const out = new Date(base);
  out.setHours(Number(m[1]), Number(m[2]), 0, 0);
  return out;
}

/** A copy of `base` moved to the calendar day `YYYY-MM-DD`, keeping its clock time. */
export function withLocalDate(base: Date, isoDate: string): Date | null {
  const day = fromLocalIsoDate(isoDate);
  if (!day) return null;
  const out = new Date(base);
  out.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
  return out;
}
