/**
 * Format a product's decimal-string price for display: drop a trailing
 * ".00" and group the integer part with thousand separators (e.g.
 * "25000.00" → "25,000", "1500.50" → "1,500.50"). Display-only — the raw
 * string is still what's sent/received over the wire, never this.
 */
export function formatProductPrice(raw: string): string {
  const [intPart = '0', decPart] = raw.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart && decPart !== '00' ? `${grouped}.${decPart}` : grouped;
}
