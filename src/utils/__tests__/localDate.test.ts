import {
  compareIsoDates,
  fromLocalIsoDate,
  isNotFutureIsoDate,
  isValidIsoDate,
  normalizeIsoDate,
  toLocalIsoDate,
  toLocalTime,
  withLocalDate,
  withLocalTime,
} from '../localDate';

describe('local calendar-day helpers', () => {
  it('keeps the LOCAL day at local midnight (toISOString would shift it east of UTC)', () => {
    expect(toLocalIsoDate(new Date(2026, 9, 10, 0, 5))).toBe('2026-10-10');
    expect(toLocalIsoDate(new Date(2026, 0, 1, 23, 59))).toBe('2026-01-01');
  });

  it('round-trips YYYY-MM-DD and rejects malformed input', () => {
    const d = fromLocalIsoDate('2026-02-28');
    expect(d && toLocalIsoDate(d)).toBe('2026-02-28');
    expect(fromLocalIsoDate('28/02/2026')).toBeNull();
  });

  it('sets the time or the day without touching the other half', () => {
    const base = new Date(2026, 9, 10, 9, 30);
    const t = withLocalTime(base, '17:45');
    expect(t && toLocalTime(t)).toBe('17:45');
    expect(t && toLocalIsoDate(t)).toBe('2026-10-10');
    const d = withLocalDate(base, '2026-12-01');
    expect(d && toLocalIsoDate(d)).toBe('2026-12-01');
    expect(d && toLocalTime(d)).toBe('09:30');
    expect(withLocalTime(base, 'xx')).toBeNull();
  });
});

describe('date-only input (padded or unpadded)', () => {
  it.each([
    ['2026-07-04', '2026-07-04'],
    ['2026-4-7', '2026-04-07'],
    ['2026-04-7', '2026-04-07'],
    ['2026-4-07', '2026-04-07'],
    ['2024-2-29', '2024-02-29'],
  ])('accepts %s as %s', (input, expected) => {
    expect(normalizeIsoDate(input)).toBe(expected);
    expect(isValidIsoDate(input)).toBe(true);
  });

  it.each([
    '2026-13-4',
    '2026-2-30',
    '2026-00-10',
    '2026-4-0',
    '2026-04-31',
    '2025-2-29',
    '7/4/2026',
    '',
  ])('rejects %s (never rolled over to another day)', (input) => {
    expect(normalizeIsoDate(input)).toBeNull();
    expect(isValidIsoDate(input)).toBe(false);
    expect(fromLocalIsoDate(input)).toBeNull();
  });

  it('an unpadded value opens the picker on the same LOCAL calendar day', () => {
    const d = fromLocalIsoDate('2026-4-7');
    expect(d && toLocalIsoDate(d)).toBe('2026-04-07');
    expect(d?.getHours()).toBe(0);
  });

  it('compares and checks "not in the future" by calendar day, not by string', () => {
    expect(compareIsoDates('2026-4-10', '2026-4-9')).toBe(1); // raw strings would say -1
    expect(compareIsoDates('2026-04-09', '2026-4-9')).toBe(0);
    expect(isNotFutureIsoDate('2026-4-9', '2026-04-10')).toBe(true);
    expect(isNotFutureIsoDate('2026-4-10', '2026-04-10')).toBe(true);
    expect(isNotFutureIsoDate('2026-4-11', '2026-04-10')).toBe(false);
    expect(isNotFutureIsoDate('2026-2-30', '2026-04-10')).toBe(false);
  });
});
