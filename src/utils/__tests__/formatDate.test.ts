import { formatDate, formatDateTime } from '../format';

describe('formatDate — the app-wide YYYY-M-D display date', () => {
  it('uses year-month-day with no leading zeros', () => {
    expect(formatDate('2026-04-09')).toBe('2026-4-9');
    expect(formatDate('2026-01-05')).toBe('2026-1-5');
    expect(formatDate('2026-12-03')).toBe('2026-12-3');
    expect(formatDate('2026-10-25')).toBe('2026-10-25');
  });

  it('is identical in every locale (Western digits)', () => {
    expect(formatDate('2026-04-09', 'ar')).toBe('2026-4-9');
    expect(formatDate('2026-04-09', 'en')).toBe('2026-4-9');
  });

  it('never shifts a date-only value through the timezone', () => {
    // parsed from its own parts, not `new Date('2026-04-09')` (UTC midnight)
    expect(formatDate('2026-03-01')).toBe('2026-3-1');
  });

  it('formats timestamps / Date objects by their local calendar date', () => {
    const d = new Date(2026, 3, 9, 23, 30);
    expect(formatDate(d)).toBe('2026-4-9');
    expect(formatDate(d.toISOString())).toBe('2026-4-9');
    expect(formatDateTime(d)).toBe('2026-4-9 23:30');
  });

  it('is safe on empty / invalid input', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('')).toBe('');
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});
