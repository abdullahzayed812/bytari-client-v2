import type { TFunction } from 'i18next';
import { z } from 'zod';

import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';

/**
 * "Grant animal access" form. The backend contract is `{ animalId: uuid }` —
 * there is no animal search / lookup-by-identifier endpoint (see §54), so the
 * animal is identified by its id, mirroring the Phase 4 add-member /
 * assign-supervisor screens.
 */
export type OrgAnimalsTFn = TFunction<'orgAnimals'>;

export function buildGrantAnimalAccessSchema(t: OrgAnimalsTFn) {
  return z.object({
    animalId: z
      .string()
      .trim()
      .uuid({ message: t('grant.errors.animalIdInvalid') }),
  });
}

export type GrantAnimalAccessFormValues = z.infer<ReturnType<typeof buildGrantAnimalAccessSchema>>;

/**
 * Feature-specific error mapping for the grant flow. Layers a few known
 * organization-animal cases on top of the generic `apiErrorMessage`; never
 * surfaces raw backend text.
 */
export function grantAnimalAccessErrorMessage(error: unknown, t: OrgAnimalsTFn): string {
  if (error instanceof ApiError) {
    if ((error.code as string) === 'ORGANIZATION_TYPE_NOT_SUPPORTED') {
      return t('grant.errors.notClinic');
    }
    if (error.status === 404) return t('grant.errors.animalNotFound');
    if (error.status === 409) return t('grant.errors.alreadyLinked');
  }
  return apiErrorMessage(error);
}
