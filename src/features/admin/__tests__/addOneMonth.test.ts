import { addOneMonth } from '../components/SubscriptionDatesDialog';

const ymd = (d: Date): string => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

describe('addOneMonth (subscription "Activate for one month")', () => {
  it('keeps the day of month', () => {
    expect(ymd(addOneMonth(new Date(2026, 10, 2)))).toBe('2026-12-2');
  });
  it('rolls over the year', () => {
    expect(ymd(addOneMonth(new Date(2026, 11, 15)))).toBe('2027-1-15');
  });
  it('clamps to the last day of a shorter month', () => {
    expect(ymd(addOneMonth(new Date(2027, 0, 31)))).toBe('2027-2-28');
    expect(ymd(addOneMonth(new Date(2028, 0, 31)))).toBe('2028-2-29');
  });
});
