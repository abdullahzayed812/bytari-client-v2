import type { TFunction } from 'i18next';
import { z } from 'zod';

import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';

/**
 * Publication form validation. Mirrors the backend EXACTLY
 * (`server/src/modules/animals/presentation/publication.schemas.ts`):
 *
 *   kind   enum        (chosen by the entry point, not the form)
 *   note   trim ≤2000  (optional)
 *
 * The backend has NO location / date / image / description field — nothing else
 * to validate.
 */
export type PublicationTFn = TFunction<'publications'>;

export function buildPublicationSchema(t: PublicationTFn) {
  return z.object({
    note: z.string().trim().max(2000, t('form.errors.noteTooLong')).optional().or(z.literal('')),
  });
}

export type PublicationFormValues = z.infer<ReturnType<typeof buildPublicationSchema>>;

/**
 * Feature-specific error mapping for the publish flow. Layers the known backend
 * cases on top of the generic `apiErrorMessage`; never surfaces raw text.
 *
 *  - 409 / `ANIMAL_NOT_ACTIVE`        → the animal is archived
 *  - 409 / `PUBLICATION_ALREADY_OPEN` → an open listing of this kind already exists
 *  - 403 / `PERMISSION_DENIED` or 404 → not your animal / not found (the backend
 *    hides non-owned animals behind a 404)
 */
export function publicationErrorMessage(error: unknown, t: PublicationTFn): string {
  if (error instanceof ApiError) {
    const code = error.code as string;
    if (code === 'ANIMAL_NOT_ACTIVE') return t('errors.animalNotActive');
    if (code === 'PUBLICATION_ALREADY_OPEN') return t('errors.alreadyOpen');
    if (error.status === 409) return t('errors.conflict');
    if (code === 'PERMISSION_DENIED' || error.status === 404) return t('errors.notYourAnimal');
  }
  return apiErrorMessage(error);
}
