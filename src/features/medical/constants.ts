import type { MedicalRecord, Vaccination } from './types';

/**
 * A clinic reads the animal's complete history but may only edit / delete
 * entries it recorded. `organizationId` on the DTO is the recording clinic.
 * Used to show the right badge and to gate the edit / delete actions client-side
 * (the backend is still authoritative — it returns 404 for another clinic's
 * record).
 */
export function recordedByThisClinic(
  entry: Pick<MedicalRecord | Vaccination, 'organizationId'>,
  organizationId: string | undefined,
): boolean {
  return Boolean(organizationId) && entry.organizationId === organizationId;
}

/**
 * Safe display of a backend date-only string (`YYYY-MM-DD`). Never parsed
 * through `Date` (§24 — no accidental timezone shift). Returns the raw string,
 * or a dash for an empty value.
 */
export function displayDateOnly(value: string | null | undefined): string {
  return value && value.trim() ? value.trim() : '—';
}
