import {
  fromLocalIsoDate,
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
