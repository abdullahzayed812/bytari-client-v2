/**
 * The platform's business calendar — mirrors the server's
 * `shared/time/business-date.ts`. Used only to reflect server rules in the UI
 * (e.g. "today's daily data is already recorded"); the server stays
 * authoritative for every date it assigns.
 */
export const BUSINESS_TIME_ZONE = 'Asia/Baghdad';

/** `YYYY-MM-DD` of `now` in {@link BUSINESS_TIME_ZONE}. */
export function businessToday(now: Date = new Date()): string {
  try {
    const formatted = new Intl.DateTimeFormat('en-CA', {
      timeZone: BUSINESS_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) return formatted;
  } catch {
    // fall through
  }
  // Engines without full ICU / time-zone data: UTC+3 arithmetic (Iraq has no DST).
  return new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
