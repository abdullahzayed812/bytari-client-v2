/**
 * Normalise a typed price / amount before validating it: Arabic-Indic (٠-٩)
 * and Persian (۰-۹) digits → ASCII, the Arabic decimal separator `٫` → `.`,
 * and thousands separators (`,` `٬`) and spaces dropped — so "١٬٥٠٠٫٧٥",
 * "1,500.75" and "1 500.75" all read as "1500.75". Typing a thousands
 * separator is no longer rejected as an invalid number.
 */
export function normalizeDecimalInput(raw: string): string {
  return raw
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, '.')
    .replace(/[,٬\s]/g, '');
}

/** A non-negative decimal with at most two fractional digits (the DB scale), e.g. "0", "12", "2750.5". */
export const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;
