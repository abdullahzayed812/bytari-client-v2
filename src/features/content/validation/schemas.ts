import type { TFunction } from 'i18next';

import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';

/**
 * Content has no mobile-side forms (management lives in the backend admin area),
 * so this module carries only the feature error mapper. It layers the known
 * content cases on top of the generic `apiErrorMessage`; never surfaces raw
 * backend text (§32).
 */
export type ContentTFn = TFunction<'content'>;

export function contentErrorMessage(error: unknown, t: ContentTFn): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return t('errors.notFound');
    if (error.status === 403) return t('errors.forbidden');
  }
  return apiErrorMessage(error);
}
