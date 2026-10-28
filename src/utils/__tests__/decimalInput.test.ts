import { normalizeDecimalInput, PRICE_PATTERN } from '../decimalInput';

describe('normalizeDecimalInput', () => {
  it.each([
    ['1500', '1500'],
    ['1,500.75', '1500.75'],
    ['1 500', '1500'],
    ['١٥٠٠', '1500'],
    ['١٬٥٠٠٫٧٥', '1500.75'],
    ['۲۵۰۰', '2500'],
    ['  12.5 ', '12.5'],
  ])('%s → %s', (raw, expected) => {
    expect(normalizeDecimalInput(raw)).toBe(expected);
  });

  it('accepts prices of any length with up to two decimals, rejects the rest', () => {
    for (const ok of ['0', '7', '999', '1000', '123456789', '2750.5', '2750.55']) {
      expect(PRICE_PATTERN.test(ok)).toBe(true);
    }
    for (const bad of ['', '-1', '1.234', 'abc', '1..2', '.5']) {
      expect(PRICE_PATTERN.test(bad)).toBe(false);
    }
  });
});
