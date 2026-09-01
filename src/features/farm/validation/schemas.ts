import type { TFunction } from 'i18next';
import { z } from 'zod';

import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';

import { POULTRY_BIRD_TYPES } from '../types';

/**
 * Farm join & poultry form validation. Mirrors the backend EXACTLY
 * (`server/src/modules/farms/presentation/farm.schemas.ts`) — same lengths,
 * same enums, same date rules. The backend re-validates authoritatively.
 */
export type FarmTFn = TFunction<'farm'>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isValidDate = (v: string): boolean => DATE_RE.test(v) && !Number.isNaN(Date.parse(v));
const isNotFuture = (v: string): boolean => new Date(v) <= new Date();

/** `joinCode` — trim, 4–40 chars, upper-cased (the backend upper-cases too). */
export function buildJoinFarmSchema(t: FarmTFn) {
  return z.object({
    joinCode: z
      .string()
      .trim()
      .min(4, t('join.errors.tooShort'))
      .max(40, t('join.errors.tooLong'))
      .transform((s) => s.toUpperCase()),
  });
}
export type JoinFarmFormValues = z.infer<ReturnType<typeof buildJoinFarmSchema>>;

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
 * Feature-specific error mapping for farm/poultry mutations. Layers the known
 * backend cases on top of the generic `apiErrorMessage`; never surfaces raw text.
 */
export function farmErrorMessage(error: unknown, t: FarmTFn): string {
  if (error instanceof ApiError) {
    const code = error.code as string;
    if (code === 'INVALID_JOIN_CODE') return t('join.errors.invalidCode');
    if (code === 'ORGANIZATION_NOT_ACTIVE') return t('join.errors.farmNotActive');
    if (code === 'VETERINARIAN_APPROVAL_REQUIRED') return t('join.errors.notApprovedVet');
    if (code === 'ORGANIZATION_TYPE_NOT_SUPPORTED') return t('errors.notFarm');
    if (code === 'POULTRY_FLOCK_NOT_ACTIVE') return t('poultry.errors.flockClosed');
    if (code === 'PERMISSION_DENIED' && error.status === 403)
      return t('join.errors.membershipEnded');
    if (error.status === 404) return t('errors.notFound');
  }
  return apiErrorMessage(error);
}
