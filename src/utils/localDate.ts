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

const DATE_ONLY_INPUT_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

/**
 * THE date-only input parser (mirrors the server's `normalizeDateOnly`):
 * accepts the month / day with or without a leading zero (`2026-4-7`,
 * `2026-04-7`, `2026-4-07`, `2026-04-07`), checks the real calendar (no
 * `2026-2-30`, month 13 or day 0) and returns the canonical `YYYY-MM-DD` —
 * or `null`. Pure arithmetic: never a `Date` string parse, so neither the
 * device timezone nor JS's day roll-over can change the calendar day.
 */
export function normalizeIsoDate(value: string): string | null {
  const m = DATE_ONLY_INPUT_RE.exec(value.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return null;
  if (day > new Date(Date.UTC(year, month, 0)).getUTCDate()) return null;
  return `${m[1]}-${pad(month)}-${pad(day)}`;
}

/** A real calendar date in `YYYY-M-D` … `YYYY-MM-DD` form. */
export function isValidIsoDate(value: string): boolean {
  return normalizeIsoDate(value) !== null;
}

/** A valid date that is not after `today` (default: the device's local day). */
export function isNotFutureIsoDate(
  value: string,
  today: string = toLocalIsoDate(new Date()),
): boolean {
  const normalized = normalizeIsoDate(value);
  return normalized !== null && normalized <= today;
}

/**
 * Order two date-only values regardless of zero-padding (`2026-4-10` is after
 * `2026-4-9`). Invalid values sort first.
 */
export function compareIsoDates(a: string, b: string): number {
  const x = normalizeIsoDate(a) ?? '';
  const y = normalizeIsoDate(b) ?? '';
  return x < y ? -1 : x > y ? 1 : 0;
}

/** `YYYY-MM-DD` (or unpadded) → a Date at LOCAL midnight of that day (`null` when not a real date). */
export function fromLocalIsoDate(value: string): Date | null {
  const normalized = normalizeIsoDate(value);
  if (!normalized) return null;
  const [y, m, d] = normalized.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
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
