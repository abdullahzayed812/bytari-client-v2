import type { TFunction } from 'i18next';
import { z } from 'zod';

import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';

/**
 * Medical-record & vaccination form validation. Mirrors the backend EXACTLY
 * (`server/src/modules/veterinary-care/presentation/veterinary-care.schemas.ts`)
 * — same lengths, same date rules, no stricter rules. The backend re-validates
 * authoritatively; a 422 is mapped back onto fields by `fieldErrors()`.
 */
export type MedicalTFn = TFunction<'medical'>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isValidDate = (v: string): boolean => DATE_RE.test(v) && !Number.isNaN(Date.parse(v));
const isNotFuture = (v: string): boolean => new Date(v) <= new Date();

// --- medical record -------------------------------------------------

/**
 *   visitDate   YYYY-MM-DD, ≤ today   (optional)
 *   reason      trim ≤ 2000           (optional)
 *   diagnosis   trim ≤ 8000           (optional)
 *   treatment   trim ≤ 8000           (optional)
 *   notes       trim ≤ 8000           (optional)
 *   → at least one of reason / diagnosis / treatment / notes
 */
export function buildMedicalRecordSchema(t: MedicalTFn) {
  const clinicalText = (max: number) =>
    z.string().trim().max(max, t('records.errors.tooLong')).optional().or(z.literal(''));

  return z
    .object({
      visitDate: z
        .string()
        .trim()
        .regex(DATE_RE, t('records.errors.dateFormat'))
        .refine((v) => isValidDate(v) && isNotFuture(v), t('records.errors.dateFuture'))
        .optional()
        .or(z.literal('')),
      reason: clinicalText(2000),
      diagnosis: clinicalText(8000),
      treatment: clinicalText(8000),
      notes: clinicalText(8000),
    })
    .refine(
      (v) => [v.reason, v.diagnosis, v.treatment, v.notes].some((s) => (s ?? '').trim().length > 0),
      { message: t('records.errors.atLeastOne'), path: ['reason'] },
    );
}

export type MedicalRecordFormValues = z.infer<ReturnType<typeof buildMedicalRecordSchema>>;

// --- vaccination --------------------------------------------------

/**
 *   vaccineName    trim 1–200              (required)
 *   administeredOn YYYY-MM-DD, ≤ today     (required)
 *   nextDueOn      YYYY-MM-DD, ≥ administeredOn  (optional; may be future)
 *   notes          trim ≤ 8000             (optional)
 */
export function buildVaccinationSchema(t: MedicalTFn) {
  return z
    .object({
      vaccineName: z
        .string()
        .trim()
        .min(1, t('vaccinations.errors.nameRequired'))
        .max(200, t('vaccinations.errors.tooLong')),
      administeredOn: z
        .string()
        .trim()
        .min(1, t('vaccinations.errors.dateRequired'))
        .regex(DATE_RE, t('vaccinations.errors.dateFormat'))
        .refine((v) => isValidDate(v) && isNotFuture(v), t('vaccinations.errors.dateFuture')),
      nextDueOn: z
        .string()
        .trim()
        .regex(DATE_RE, t('vaccinations.errors.dateFormat'))
        .refine(isValidDate, t('vaccinations.errors.dateFormat'))
        .optional()
        .or(z.literal('')),
      notes: z
        .string()
        .trim()
        .max(8000, t('vaccinations.errors.tooLong'))
        .optional()
        .or(z.literal('')),
    })
    .refine((v) => !v.nextDueOn || v.nextDueOn >= v.administeredOn, {
      message: t('vaccinations.errors.dueBeforeAdministered'),
      path: ['nextDueOn'],
    });
}

export type VaccinationFormValues = z.infer<ReturnType<typeof buildVaccinationSchema>>;

// --- error mapping ---------------------------------------------------

/**
 * Feature-specific mapping for the medical mutations. Layers the few known
 * veterinary-care cases on top of the generic `apiErrorMessage`; never surfaces
 * raw backend text.
 *
 *  - 409 / `ANIMAL_NOT_ACTIVE` → the animal is archived and cannot be modified
 *  - 404 on update / delete    → the record does not exist, or was recorded by
 *    another clinic (the backend deliberately does not distinguish the two)
 */
export function medicalErrorMessage(error: unknown, t: MedicalTFn): string {
  if (error instanceof ApiError) {
    if ((error.code as string) === 'ANIMAL_NOT_ACTIVE' || error.status === 409) {
      return t('errors.animalNotActive');
    }
    if (error.status === 404) return t('errors.notFoundOrOtherClinic');
  }
  return apiErrorMessage(error);
}
