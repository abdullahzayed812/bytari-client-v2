import { callingCodeFor } from '../data/callingCodes';

/**
 * Registration phone helpers. The form keeps the calling country (ISO code)
 * and the national number apart; the backend still receives — and stores —
 * ONE international string (`+9647701234567`), exactly the shape the
 * existing `phoneSchema` (`server/src/shared/validation/common.ts`) and every
 * phone display/`tel:` link already use. No server or column change needed.
 */

/** Spaces, dashes, dots and parentheses users commonly type between digits. */
const SEPARATORS_RE = /[\s\-().]/g;

/** National part: digits only once separators are removed. */
const NATIONAL_DIGITS_RE = /^[0-9]+$/;

/** E.164 caps the full number (dial code + national) at 15 digits. */
const E164_MAX_DIGITS = 15;
/** Shortest national significant number we accept (after the trunk 0). */
const NATIONAL_MIN_DIGITS = 6;

/** Separator-free national digits with the domestic trunk prefix (leading 0s) dropped. */
export function nationalSignificantDigits(national: string): string {
  return national.replace(SEPARATORS_RE, '').replace(/^0+/, '');
}

/** True when `national` holds only digits (plus common separators). */
export function isNationalNumberFormat(national: string): boolean {
  return NATIONAL_DIGITS_RE.test(national.replace(SEPARATORS_RE, ''));
}

/**
 * Whether `national` is a plausible number for the calling country `code`:
 * digits only, at least 6 significant digits, and ≤ 15 digits in total with
 * the dial code (E.164). Unknown country → invalid.
 */
export function isValidNationalNumber(code: string, national: string): boolean {
  const country = callingCodeFor(code);
  if (!country || !isNationalNumberFormat(national)) return false;
  const digits = nationalSignificantDigits(national);
  return (
    digits.length >= NATIONAL_MIN_DIGITS && country.dial.length + digits.length <= E164_MAX_DIGITS
  );
}

/**
 * `IQ` + `0770 123 4567` → `+9647701234567`. The leading trunk `0` Iraqi
 * (and most other) users type is dropped, since it is never dialled after
 * the country code. Call only with values that passed `isValidNationalNumber`.
 */
export function toInternationalPhone(code: string, national: string): string {
  const country = callingCodeFor(code);
  if (!country) throw new Error(`Unknown calling code country: ${code}`);
  return `+${country.dial}${nationalSignificantDigits(national)}`;
}
