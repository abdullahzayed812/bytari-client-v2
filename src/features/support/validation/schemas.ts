import type { TFunction } from 'i18next';
import { z } from 'zod';

import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';

import { CONSULTATION_ANIMAL_TYPES, INQUIRY_CATEGORIES } from '../types';

/**
 * Consultation / Inquiry form validation. Mirrors the backend
 * (`thread.schemas.ts`): `body` (1–4000). A consultation names an animal TYPE
 * (required here — any animal, owned or not) plus an OPTIONAL owned `animalId`;
 * an inquiry names a `category`. There is no separate title — the card shows
 * the start of the first message.
 */
export type SupportTFn = TFunction<'support'>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function bodyField(t: SupportTFn) {
  return z
    .string()
    .trim()
    .min(1, t('form.errors.bodyRequired'))
    .max(4000, t('form.errors.bodyTooLong'));
}

export function buildConsultationSchema(t: SupportTFn) {
  return z.object({
    body: bodyField(t),
    animalType: z.enum(CONSULTATION_ANIMAL_TYPES, {
      errorMap: () => ({ message: t('form.errors.animalTypeRequired') }),
    }),
    animalId: z
      .string()
      .trim()
      .regex(UUID_RE, t('form.errors.animalInvalid'))
      .optional()
      .or(z.literal('')),
  });
}
export type ConsultationFormValues = z.infer<ReturnType<typeof buildConsultationSchema>>;

export function buildInquirySchema(t: SupportTFn) {
  return z.object({
    body: bodyField(t),
    category: z.enum(INQUIRY_CATEGORIES, {
      errorMap: () => ({ message: t('form.errors.categoryRequired') }),
    }),
  });
}
export type InquiryFormValues = z.infer<ReturnType<typeof buildInquirySchema>>;

export function buildMessageSchema(t: SupportTFn) {
  return z.object({ body: bodyField(t) });
}
export type MessageFormValues = z.infer<ReturnType<typeof buildMessageSchema>>;

/**
 * Feature-specific error mapping. Layers the known thread cases on top of the
 * generic `apiErrorMessage`; never surfaces raw backend text (§35, §36).
 */
export function supportErrorMessage(error: unknown, t: SupportTFn): string {
  if (error instanceof ApiError) {
    const code = error.code as string;
    if (code === 'THREAD_NOT_WRITABLE') {
      return error.status === 403 ? t('errors.senderBlocked') : t('errors.threadClosed');
    }
    if (code === 'PERMISSION_DENIED' || error.status === 403) return t('errors.forbidden');
    if (error.status === 404) return t('errors.notFound');
    if (error.status === 409) return t('errors.conflict');
  }
  return apiErrorMessage(error);
}
