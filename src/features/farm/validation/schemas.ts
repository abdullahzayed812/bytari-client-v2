import type { TFunction } from 'i18next';
import { z } from 'zod';

import { POULTRY_PRODUCTION_TYPES, IRAQ_GOVERNORATES } from '../constants';
import { POULTRY_BIRD_TYPES } from '../types';

/**
 * Poultry-specific form validation. Mirrors the backend EXACTLY
 * (`server/src/modules/farms/presentation/poultry-flock.schemas.ts`) — same
 * lengths, same enums, same date rules. The backend re-validates authoritatively.
 * Generic farm join/error-mapping validation lives in `@/features/farmShared`.
 */
export type FarmTFn = TFunction<'farm'>;
/** The "Add Poultry Farm" form + landing live in the `poultry` namespace. */
export type PoultryTFn = TFunction<'poultry'>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isValidDate = (v: string): boolean => DATE_RE.test(v) && !Number.isNaN(Date.parse(v));
const isNotFuture = (v: string): boolean => new Date(v) <= new Date();

/**
 *   name        trim 1–120           (required)
 *   birdType    enum                 (required)
 *   birdCount   int 0 … 100_000_000  (required)
 *   arrivalDate YYYY-MM-DD, ≤ today   (required)
 *   notes       trim ≤ 4000          (optional)
 *   status      enum (edit only)
 */
export function buildPoultryFlockSchema(t: FarmTFn) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('poultry.errors.nameRequired'))
      .max(120, t('poultry.errors.tooLong')),
    birdType: z.enum(POULTRY_BIRD_TYPES, { message: t('poultry.errors.birdTypeRequired') }),
    // Kept as a validated string so the RHF field round-trips cleanly; the
    // screen converts to a number for the request body.
    birdCount: z
      .string()
      .trim()
      .min(1, t('poultry.errors.countRequired'))
      .regex(/^\d{1,9}$/, t('poultry.errors.countInvalid'))
      .refine((v) => Number(v) <= 100_000_000, t('poultry.errors.countInvalid')),
    arrivalDate: z
      .string()
      .trim()
      .min(1, t('poultry.errors.arrivalRequired'))
      .regex(DATE_RE, t('poultry.errors.dateFormat'))
      .refine((v) => isValidDate(v) && isNotFuture(v), t('poultry.errors.dateFuture')),
    notes: z.string().trim().max(4000, t('poultry.errors.tooLong')).optional().or(z.literal('')),
  });
}
export type PoultryFlockFormValues = z.infer<ReturnType<typeof buildPoultryFlockSchema>>;

/**
 * "Add Poultry Farm" form. Mirrors `server` `createFarmBodySchema` — required:
 * name, location, governorate, production type. Numeric fields round-trip as
 * validated strings; the screen converts them for the request. `termsAccepted`
 * is a client-only gate (اضغط للقراءة والموافقة).
 */
const optionalCount = z
  .string()
  .trim()
  .regex(/^\d{1,9}$/)
  .optional()
  .or(z.literal(''));

export function buildCreatePoultryFarmSchema(t: PoultryTFn) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('create.errors.nameRequired'))
      .max(160, t('create.errors.tooLong')),
    location: z
      .string()
      .trim()
      .min(1, t('create.errors.locationRequired'))
      .max(200, t('create.errors.tooLong')),
    governorate: z
      .string()
      .min(1, t('create.errors.governorateRequired'))
      .refine((v) => (IRAQ_GOVERNORATES as readonly string[]).includes(v), {
        message: t('create.errors.governorateRequired'),
      }),
    poultryProductionType: z.enum(POULTRY_PRODUCTION_TYPES, {
      message: t('create.errors.productionRequired'),
    }),
    description: z
      .string()
      .trim()
      .max(2000, t('create.errors.tooLong'))
      .optional()
      .or(z.literal('')),
    address: z.string().trim().max(500, t('create.errors.tooLong')).optional().or(z.literal('')),
    capacity: optionalCount,
    currentBirdCount: optionalCount,
    contactName: z
      .string()
      .trim()
      .max(160, t('create.errors.tooLong'))
      .optional()
      .or(z.literal('')),
    contactPhone: z
      .string()
      .trim()
      .max(40, t('create.errors.tooLong'))
      .optional()
      .or(z.literal('')),
    contactEmail: z
      .string()
      .trim()
      .email(t('create.errors.emailInvalid'))
      .optional()
      .or(z.literal('')),
    termsAccepted: z
      .boolean()
      .refine((v) => v === true, { message: t('create.errors.termsRequired') }),
  });
}
export type CreatePoultryFarmFormValues = z.infer<ReturnType<typeof buildCreatePoultryFarmSchema>>;

/**
 * Farm Settings → "معلومات الحقل" edit form. A subset of the create schema —
 * only the fields shown on that tab (no governorate/description/contactName/
 * contactEmail/image edit here). Submits as two separate calls
 * (`useUpdateOrganization` for `name`, `useUpdateFarmProfile` for the rest).
 */
export function buildFarmSettingsInfoSchema(t: PoultryTFn) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('create.errors.nameRequired'))
      .max(160, t('create.errors.tooLong')),
    location: z
      .string()
      .trim()
      .min(1, t('create.errors.locationRequired'))
      .max(200, t('create.errors.tooLong')),
    address: z.string().trim().max(500, t('create.errors.tooLong')).optional().or(z.literal('')),
    poultryProductionType: z.enum(POULTRY_PRODUCTION_TYPES, {
      message: t('create.errors.productionRequired'),
    }),
    capacity: optionalCount,
    currentBirdCount: optionalCount,
    contactPhone: z
      .string()
      .trim()
      .max(40, t('create.errors.tooLong'))
      .optional()
      .or(z.literal('')),
  });
}
export type FarmSettingsInfoFormValues = z.infer<ReturnType<typeof buildFarmSettingsInfoSchema>>;
