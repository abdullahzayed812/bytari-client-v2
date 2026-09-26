import type { TFunction } from 'i18next';
import { z } from 'zod';

import { IRAQ_GOVERNORATES } from '@/constants/governorates';

import { CATTLE_PRODUCTION_TYPE_ORDER, SHEEP_PRODUCTION_TYPE_ORDER } from '../constants';

/**
 * Sheep/Cattle form validation. Mirrors `buildCreatePoultryFarmSchema`/
 * `buildPoultryFlockSchema` exactly in structure — same lengths, same date
 * rules. The backend re-validates authoritatively. Generic farm join/error
 * mapping lives in `@/features/farmShared` (`farmErrorMessage`).
 */
export type LivestockTFn = TFunction<'sheepCattleFarm'>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isValidDate = (v: string): boolean => DATE_RE.test(v) && !Number.isNaN(Date.parse(v));
const isNotFuture = (v: string): boolean => new Date(v) <= new Date();
const optionalCount = z
  .string()
  .trim()
  .regex(/^\d{1,9}$/)
  .optional()
  .or(z.literal(''));

// --- create farm (Sheep) ------------------------------------------

export function buildCreateSheepFarmSchema(t: LivestockTFn) {
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
    sheepProductionType: z.enum(SHEEP_PRODUCTION_TYPE_ORDER, {
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
    currentSheepCount: optionalCount,
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
export type CreateSheepFarmFormValues = z.infer<ReturnType<typeof buildCreateSheepFarmSchema>>;

export function buildCreateCattleFarmSchema(t: LivestockTFn) {
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
    cattleProductionType: z.enum(CATTLE_PRODUCTION_TYPE_ORDER, {
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
    currentCattleCount: optionalCount,
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
export type CreateCattleFarmFormValues = z.infer<ReturnType<typeof buildCreateCattleFarmSchema>>;

// --- batch (add/edit) ------------------------------------------

function batchSchemaShape(t: LivestockTFn, requirePrice: boolean) {
  return {
    name: z
      .string()
      .trim()
      .min(1, t('batchForm.errors.nameRequired'))
      .max(120, t('batchForm.errors.tooLong')),
    breed: z.string().trim().max(120, t('batchForm.errors.tooLong')).optional().or(z.literal('')),
    headCount: z
      .string()
      .trim()
      .min(1, t('batchForm.errors.countRequired'))
      .regex(/^\d{1,9}$/, t('batchForm.errors.countInvalid')),
    arrivalDate: z
      .string()
      .trim()
      .min(1, t('batchForm.errors.arrivalRequired'))
      .regex(DATE_RE, t('batchForm.errors.dateFormat'))
      .refine((v) => isValidDate(v) && isNotFuture(v), t('batchForm.errors.dateFuture')),
    // The server's estimated profit = head count × avg weight × THIS price − expenses.
    // Only the farm owner sees / sets it (financial data — backend-enforced); others submit none.
    targetPricePerKg: requirePrice
      ? z
          .string()
          .trim()
          .min(1, t('batchForm.errors.priceRequired'))
          .regex(/^\d{1,10}(\.\d{1,2})?$/, t('batchForm.errors.priceInvalid'))
      : z.string().trim().optional().or(z.literal('')),
    notes: z.string().trim().max(4000, t('batchForm.errors.tooLong')).optional().or(z.literal('')),
  };
}

export function buildSheepBatchSchema(t: LivestockTFn, opts: { requirePrice?: boolean } = {}) {
  return z.object({
    ...batchSchemaShape(t, opts.requirePrice ?? true),
    lambCount: optionalCount,
    maleCount: optionalCount,
    femaleCount: optionalCount,
  });
}
export type SheepBatchFormValues = z.infer<ReturnType<typeof buildSheepBatchSchema>>;

export function buildCattleBatchSchema(t: LivestockTFn, opts: { requirePrice?: boolean } = {}) {
  return z.object({
    ...batchSchemaShape(t, opts.requirePrice ?? true),
    calfCount: optionalCount,
    bullCount: optionalCount,
    cowCount: optionalCount,
  });
}
export type CattleBatchFormValues = z.infer<ReturnType<typeof buildCattleBatchSchema>>;
