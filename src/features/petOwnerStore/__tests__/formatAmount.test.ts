import { formatAmount } from '../utils';

describe('formatAmount (Iraqi Dinar)', () => {
  it('groups thousands and drops a zero fraction', () => {
    expect(formatAmount('25000.00')).toBe('25,000');
    expect(formatAmount('1250000.00')).toBe('1,250,000');
    expect(formatAmount('85.00')).toBe('85');
  });
  it('keeps a real fraction', () => {
    expect(formatAmount('12.50')).toBe('12.50');
    expect(formatAmount('1000.25')).toBe('1,000.25');
  });
});
