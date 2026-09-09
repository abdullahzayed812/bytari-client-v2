/**
 * "تواصل معنا" — the app's published contact channels (shown on the Contact
 * page). Static, product-owned values; not user data.
 */
export const CONTACT_INFO = {
  email: 'baytariapp@gmail.com',
  phone: '+964 777 756 4666',
  whatsapp: '+964 777 756 4666',
  address: 'بغداد، العراق',
} as const;

/** Digits-only phone for `tel:` / `wa.me` links. */
export function phoneDigits(value: string): string {
  return value.replace(/[^\d]/g, '');
}
