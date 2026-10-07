import { formatDate } from '@/utils';

import type { AnimalReminder, MedicalRecord, Vaccination } from './types';

/**
 * A clinic reads the animal's complete history but may only edit / delete
 * entries it recorded. `organizationId` on the DTO is the recording clinic.
 * Used to show the right badge and to gate the edit / delete actions client-side
 * (the backend is still authoritative — it returns 404 for another clinic's
 * record).
 */
export function recordedByThisClinic(
  entry: Pick<MedicalRecord | Vaccination | AnimalReminder, 'organizationId'>,
  organizationId: string | undefined,
): boolean {
  return Boolean(organizationId) && entry.organizationId === organizationId;
}

/**
 * Safe display of a backend date-only string (`YYYY-MM-DD`) as the app-wide
 * `YYYY-M-D` display date. `formatDate` reads a date-only value from its own
 * parts — never through `Date` (§24 — no accidental timezone shift). A dash
 * for an empty value.
 */
export function displayDateOnly(value: string | null | undefined): string {
  return value && value.trim() ? formatDate(value.trim()) : '—';
}

/** Mirrors the backend `MEDICAL_ATTACHMENTS_MAX`. */
export const MEDICAL_RECORD_ATTACHMENTS_MAX = 10;

/** Legacy severity colours (شديدة red · متوسطة amber · خفيفة green). */
export const SEVERITY_TONE = { SEVERE: 'danger', MODERATE: 'warning', MILD: 'success' } as const;

/** Legacy record-type badge tone (quick review amber, everything else primary). */
export const RECORD_TYPE_TONE = {
  GENERAL: 'primary',
  QUICK_REVIEW: 'warning',
  FULL_EXAM: 'primary',
  LAB: 'info',
  FILE: 'neutral',
} as const;

export const VACCINATION_STATUS_TONE = {
  SCHEDULED: 'info',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
} as const;

/** `YYYY-MM-DD` + `days` (local calendar; for next-due suggestions). */
export function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** Today's local date as `YYYY-MM-DD`. */
export function todayIso(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mm}-${dd}`;
}
