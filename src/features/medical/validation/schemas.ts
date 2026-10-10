import type { TFunction } from 'i18next';
import { z } from 'zod';

import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { compareIsoDates, isNotFutureIsoDate, isValidIsoDate } from '@/utils';

/**
 * Medical-record & vaccination form validation. Mirrors the backend EXACTLY
 * (`server/src/modules/veterinary-care/presentation/veterinary-care.schemas.ts`)
 * — same lengths, same date rules, no stricter rules. The backend re-validates
 * authoritatively; a 422 is mapped back onto fields by `fieldErrors()`.
 */
export type MedicalTFn = TFunction<'medical'>;

const isValidDate = isValidIsoDate;
const isNotFuture = (v: string): boolean => isNotFutureIsoDate(v);

// --- medical record -------------------------------------------------

/**
 *   visitDate     YYYY-MM-DD, ≤ today   (optional)
 *   reason        trim ≤ 2000           (optional)
 *   diagnosis / treatment / notes / symptoms / labNotes   trim ≤ 8000 (optional)
 *   severity      SEVERE | MODERATE | MILD | ''
 *   instructions + medications[]   UI-only — folded into `treatment` on submit
 *
 * Which fields are REQUIRED depends on the entry flow (full exam, lab, file,
 * generic) and is checked by `MedicalRecordForm`, because attachments live
 * outside the form state.
 */
export function buildMedicalRecordSchema(t: MedicalTFn) {
  const clinicalText = (max: number) =>
    z.string().trim().max(max, t('records.errors.tooLong')).optional().or(z.literal(''));

  return z.object({
    visitDate: z
      .string()
      .trim()
      .refine(isValidDate, t('records.errors.dateFormat'))
      .refine((v) => isValidDate(v) && isNotFuture(v), t('records.errors.dateFuture'))
      .optional()
      .or(z.literal('')),
    reason: clinicalText(2000),
    diagnosis: clinicalText(8000),
    treatment: clinicalText(8000),
    notes: clinicalText(8000),
    symptoms: clinicalText(8000),
    labNotes: clinicalText(8000),
    instructions: clinicalText(2000),
    severity: z.enum(['', 'SEVERE', 'MODERATE', 'MILD']).optional(),
    medications: z
      .array(
        z.object({
          name: z.string().trim().max(200, t('records.errors.tooLong')),
          dosage: z.string().trim().max(200, t('records.errors.tooLong')).optional(),
          duration: z.string().trim().max(200, t('records.errors.tooLong')).optional(),
        }),
      )
      .optional(),
  });
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
        .refine(isValidDate, t('vaccinations.errors.dateFormat'))
        .refine((v) => isValidDate(v) && isNotFuture(v), t('vaccinations.errors.dateFuture')),
      nextDueOn: z
        .string()
        .trim()
        .refine(isValidDate, t('vaccinations.errors.dateFormat'))
        .optional()
        .or(z.literal('')),
      notes: z
        .string()
        .trim()
        .max(8000, t('vaccinations.errors.tooLong'))
        .optional()
        .or(z.literal('')),
      /** Legacy scheduled / completed / cancelled; empty = derived by the backend. */
      status: z.enum(['', 'SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
    })
    .refine((v) => !v.nextDueOn || compareIsoDates(v.nextDueOn, v.administeredOn) >= 0, {
      message: t('vaccinations.errors.dueBeforeAdministered'),
      path: ['nextDueOn'],
    });
}

export type VaccinationFormValues = z.infer<ReturnType<typeof buildVaccinationSchema>>;

// --- reminder ------------------------------------------------------

/**
 *   title         trim 1–200   (required)
 *   description   trim ≤ 8000  (optional)
 *   reminderDate  YYYY-MM-DD   (required; may be future)
 *   reminderType  CHECKUP | VACCINATION | MEDICATION | OTHER
 */
export function buildReminderSchema(t: MedicalTFn) {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, t('reminders.errors.titleRequired'))
      .max(200, t('reminders.errors.tooLong')),
    description: z
      .string()
      .trim()
      .max(8000, t('reminders.errors.tooLong'))
      .optional()
      .or(z.literal('')),
    reminderDate: z
      .string()
      .trim()
      .min(1, t('reminders.errors.dateRequired'))
      .refine(isValidDate, t('reminders.errors.dateFormat')),
    reminderType: z.enum(['CHECKUP', 'VACCINATION', 'MEDICATION', 'OTHER']),
  });
}
export type ReminderFormValues = z.infer<ReturnType<typeof buildReminderSchema>>;

// --- quick-review template ---------------------------------------------

export function buildTemplateSchema(t: MedicalTFn) {
  const text = z.string().trim().max(8000).optional().or(z.literal(''));
  return z.object({
    name: z.string().trim().min(1, t('templates.errors.nameRequired')).max(200),
    templateType: z.enum(['VACCINE', 'TREATMENT', 'DIAGNOSIS', 'GENERAL']),
    defaultDiagnosis: text,
    defaultTreatment: text,
    defaultNotes: text,
    intervalDays: z
      .string()
      .trim()
      .regex(/^\d*$/, t('templates.errors.interval'))
      .refine(
        (v) => v === '' || (Number(v) > 0 && Number(v) <= 3650),
        t('templates.errors.interval'),
      )
      .optional(),
  });
}
export type TemplateFormValues = z.infer<ReturnType<typeof buildTemplateSchema>>;

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
