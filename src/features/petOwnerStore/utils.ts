/**
 * Format a `numeric(12,2)` decimal string for display: drop a trailing `.00`
 * (`"85.00"` → `"85"`), keep real fractions (`"12.50"` → `"12.50"`). The
 * currency word is added by the caller via the `common.price` i18n string.
 */
export function formatAmount(amount: string): string {
  return amount.replace(/\.00$/, '');
}
