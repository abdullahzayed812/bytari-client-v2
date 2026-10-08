/**
 * Short public pet ID (`animals.public_code`, server `public-code.ts`):
 * 7 symbols from an alphabet without look-alikes (no 0/O, 1/I/L, U).
 * Stored as `K7M4QXR`, shown as `K7M-4QXR` so it is easy to read out in two
 * chunks. Input is accepted in any case, with or without the dash / spaces.
 */
export const PET_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
export const PET_CODE_LENGTH = 7;

const CODE_RE = new RegExp(`^[${PET_CODE_ALPHABET}]{${PET_CODE_LENGTH}}$`);
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** `K7M4QXR` → `K7M-4QXR` (anything else is returned unchanged). */
export function formatPetCode(code: string | null | undefined): string {
  if (!code) return '';
  return CODE_RE.test(code) ? `${code.slice(0, 3)}-${code.slice(3)}` : code;
}

/** Typed / pasted text → stored form, or `null` when it cannot be a pet code. */
export function normalizePetCode(input: string): string | null {
  const compact = input.replace(/[\s\-_#]/g, '').toUpperCase();
  return CODE_RE.test(compact) ? compact : null;
}

/**
 * What a scan / typed value identifies: the short code (new QR + verbal), or a
 * full UUID (QR codes printed before the short code existed, possibly inside a
 * link). `null` → treat it as free-text search.
 */
export function petCodeFromInput(input: string): string | null {
  const uuid = input.match(UUID_RE)?.[0];
  if (uuid) return uuid.toLowerCase();
  const tail =
    input
      .trim()
      .split(/[/?=#]/)
      .pop() ?? '';
  return normalizePetCode(tail);
}
