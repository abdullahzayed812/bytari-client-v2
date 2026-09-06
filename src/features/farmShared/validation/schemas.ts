import type { TFunction } from 'i18next';
import { z } from 'zod';

import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';

/**
 * Genuinely cross-farm-type validation — join-by-code and the shared API
 * error mapper. Mirrors the backend EXACTLY (`server/src/modules/farms/presentation/farm.schemas.ts`'s
 * generic half). Poultry/sheep/cattle-specific schemas live in their own features.
 */
export type FarmTFn = TFunction<'farm'>;

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
 * Feature-specific error mapping for farm mutations. Layers the known
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
