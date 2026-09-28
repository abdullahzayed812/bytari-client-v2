/**
 * Format a `numeric(12,2)` Iraqi-Dinar amount for display: thousands
 * separators, a trailing `.00` dropped (`"25000.00"` → `"25,000"`), real
 * fractions kept (`"12.50"` → `"12.50"`). The currency word ("د.ع") is added by
 * the caller via the `common.price` i18n string.
 */
export function formatAmount(amount: string): string {
  const [int = '0', frac] = amount.trim().split('.');
  const negative = int.startsWith('-');
  const digits = negative ? int.slice(1) : int;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fraction = frac && !/^0+$/.test(frac) ? `.${frac}` : '';
  return `${negative ? '-' : ''}${grouped}${fraction}`;
}
