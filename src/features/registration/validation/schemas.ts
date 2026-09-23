import type { TFunction } from 'i18next';
import { z } from 'zod';

/**
 * Registration-flow validation. Personal-info fields mirror the existing
 * `auth` register schema exactly (`server/src/modules/auth/auth.schemas.ts`):
 *
 *   firstName/lastName(1–100) · email · phone? · password(≥10, ≤128)
 *
 * plus the new optional-on-the-wire-but-required-here fields this flow
 * collects: `country` (2-letter ISO) and `gender`. The veterinarian schema
 * additionally mirrors `server/src/modules/veterinarians/*` — `subType` plus
 * per-`subType` required documents — as a defense-in-depth duplicate of the
 * backend's own rule (§ veterinarian.apply contract).
 */
export type RegistrationTFn = TFunction<'registration'>;

const PHONE_RE = /^\+?[0-9][0-9\s\-()]{5,23}$/;

/**
 * A document picked LOCALLY (`LocalImageUploader`, not yet uploaded — see
 * `DocumentUploadTile`). Mirrors `LocalFile` (`@/services/files/types`); kept
 * as its own zod shape here rather than importing that interface, since the
 * upload itself happens later, outside RHF, in `VeterinarianRegisterScreen`.
 */
const localFileSchema = z.object({
  uri: z.string().min(1),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().optional(),
});

function buildPersonalShape(t: RegistrationTFn) {
  return {
    firstName: z.string().trim().min(1, t('errors.nameRequired')).max(100, t('errors.nameTooLong')),
    lastName: z.string().trim().min(1, t('errors.nameRequired')).max(100, t('errors.nameTooLong')),
    email: z
      .string()
      .trim()
      .min(1, t('errors.emailRequired'))
      .email(t('errors.emailInvalid'))
      .max(254),
    phone: z.string().trim().regex(PHONE_RE, t('errors.phoneInvalid')).optional().or(z.literal('')),
    password: z
      .string()
      .min(10, t('errors.passwordTooShort'))
      .max(128, t('errors.passwordInvalid')),
    confirmPassword: z.string().min(1, t('errors.confirmPasswordRequired')),
    country: z.string().length(2, t('errors.countryRequired')),
    gender: z.enum(['MALE', 'FEMALE']).optional(),
    terms: z.boolean(),
  };
}

export function buildPetOwnerSchema(t: RegistrationTFn) {
  return z.object(buildPersonalShape(t)).superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('errors.passwordMismatch'),
        path: ['confirmPassword'],
      });
    }
    if (!values.gender) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('errors.genderRequired'),
        path: ['gender'],
      });
    }
    if (values.terms !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('errors.termsRequired'),
        path: ['terms'],
      });
    }
  });
}

export type PetOwnerFormValues = z.infer<ReturnType<typeof buildPetOwnerSchema>>;

export function buildVeterinarianSchema(t: RegistrationTFn) {
  return z
    .object({
      ...buildPersonalShape(t),
      subType: z.enum(['VETERINARIAN', 'STUDENT']),
      licenseOrId: localFileSchema.optional(),
      additionalId: localFileSchema.optional(),
      studentIdFront: localFileSchema.optional(),
      studentIdBack: localFileSchema.optional(),
    })
    .superRefine((values, ctx) => {
      if (values.password !== values.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('errors.passwordMismatch'),
          path: ['confirmPassword'],
        });
      }
      if (!values.gender) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('errors.genderRequired'),
          path: ['gender'],
        });
      }
      if (values.terms !== true) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('errors.termsRequired'),
          path: ['terms'],
        });
      }
      // Mirrors the backend's per-subType required-document rule exactly.
      if (values.subType === 'VETERINARIAN' && !values.licenseOrId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('veterinarian.errors.licenseRequired'),
          path: ['licenseOrId'],
        });
      }
      if (values.subType === 'STUDENT') {
        if (!values.studentIdFront) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('veterinarian.errors.studentIdFrontRequired'),
            path: ['studentIdFront'],
          });
        }
        if (!values.studentIdBack) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('veterinarian.errors.studentIdBackRequired'),
            path: ['studentIdBack'],
          });
        }
      }
    });
}

export type VeterinarianFormValues = z.infer<ReturnType<typeof buildVeterinarianSchema>>;
