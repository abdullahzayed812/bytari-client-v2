/** Small, dependency-free formatting helpers. Locale-aware where it matters. */

export function fullName(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(' ').trim();
}

export function initialsOf(name?: string | null): string {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('');
}

const DATE_ONLY_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

/**
 * THE app-wide display date: `YYYY-M-D` — year first, no leading zero on the
 * month or day, Western digits, in every locale (e.g. `2026-4-9`,
 * `2026-12-3`). Display-only: API / storage values stay ISO.
 *
 * A date-only value (`2026-04-09`) is formatted from its own parts, so it can
 * never shift a day through the device's timezone; a timestamp is shown in the
 * device's local calendar date. `_locale` is accepted for call-site
 * compatibility — the format is the same in every language.
 */
export function formatDate(iso: string | Date | null | undefined, _locale?: string): string {
  if (iso == null || iso === '') return '';
  if (typeof iso === 'string') {
    const m = DATE_ONLY_RE.exec(iso.trim());
    if (m) return `${Number(m[1])}-${Number(m[2])}-${Number(m[3])}`;
  }
  const date = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(date.getTime())) return typeof iso === 'string' ? iso : '';
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/** {@link formatDate} + the local time of day, e.g. `2026-4-9 14:05`. */
export function formatDateTime(iso: string | Date | null | undefined): string {
  if (iso == null || iso === '') return '';
  const date = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(date.getTime())) return typeof iso === 'string' ? iso : '';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${formatDate(date)} ${hh}:${mm}`;
}

/** `2026-08-28T10:24:00Z` → localised time-of-day, e.g. "10:24 ص". */
export function formatTime(iso: string, locale: string = 'ar'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** `2026-08-28` → localised weekday name, e.g. "الأربعاء" / "Wednesday". */
export function formatWeekday(iso: string, locale: string = 'ar'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    weekday: 'long',
  }).format(date);
}

export function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/** Bytes → `1.4 MB` / `812 KB` / `0 B`. `undefined` → `''`. */
export function formatBytes(bytes?: number | null): string {
  if (bytes == null || Number.isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}
