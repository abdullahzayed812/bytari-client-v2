import type { TFunction } from 'i18next';
import { z } from 'zod';

/**
 * Veterinarian-application form. Mirrors the backend
 * (`server/src/modules/veterinarians/veterinarian.schemas.ts`):
 *
 *   note      trim ≤1000                                (optional)
 *   subType   VETERINARIAN | STUDENT                     (required)
 *   documents VETERINARIAN → LICENSE_OR_ID required, ADDITIONAL_ID optional
 *             STUDENT      → STUDENT_ID_FRONT + STUDENT_ID_BACK both required
 *
 * The document-requiredness check is duplicated from the backend on purpose
 * (defense in depth) — it must mirror the server's own rule exactly.
 */
export type VetTFn = TFunction<'veterinarian'>;

const documentRefSchema = z.object({
  storageKey: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
});

export function buildApplySchema(t: VetTFn) {
  return z
    .object({
      note: z.string().trim().max(1000, t('apply.errors.noteTooLong')).optional().or(z.literal('')),
      subType: z.enum(['VETERINARIAN', 'STUDENT']),
      licenseOrId: documentRefSchema.optional(),
      additionalId: documentRefSchema.optional(),
      studentIdFront: documentRefSchema.optional(),
      studentIdBack: documentRefSchema.optional(),
    })
    .superRefine((values, ctx) => {
      if (values.subType === 'VETERINARIAN' && !values.licenseOrId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('apply.errors.licenseRequired'),
          path: ['licenseOrId'],
        });
      }
      if (values.subType === 'STUDENT') {
        if (!values.studentIdFront) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('apply.errors.studentIdFrontRequired'),
            path: ['studentIdFront'],
          });
        }
        if (!values.studentIdBack) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('apply.errors.studentIdBackRequired'),
            path: ['studentIdBack'],
          });
        }
      }
    });
}

export type ApplyFormValues = z.infer<ReturnType<typeof buildApplySchema>>;
