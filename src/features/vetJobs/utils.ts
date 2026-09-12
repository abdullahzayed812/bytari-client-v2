import type { TFunction } from 'i18next';

/**
 * Format a `numeric(12,2)` decimal string for display: drop a trailing `.00`
 * (`"1800000.00"` → `"1,800,000"`), keep real fractions, and thousands-separate.
 */
export function formatAmount(amount: string): string {
  const [whole = '0', frac] = amount.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac && frac !== '00' ? `${grouped}.${frac}` : grouped;
}

/** Salary display: the amount if present, "negotiable" if flagged, else nothing. */
export function formatSalary(
  amount: string | null,
  negotiable: boolean,
  t: TFunction<'vetJobs'>,
): string {
  if (amount) return formatAmount(amount);
  if (negotiable) return t('offers.negotiable');
  return '';
}
