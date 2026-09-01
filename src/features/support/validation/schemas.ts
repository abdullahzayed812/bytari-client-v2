import type { TFunction } from 'i18next';
import { z } from 'zod';

import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';

/**
 * Consultation / Inquiry form validation. Mirrors the backend EXACTLY
 * (`thread.schemas.ts`): the only real field is `body` (1–4000). A consultation
 * may additionally carry an optional `animalId`. There is NO title / description
 * / category — the "description" IS the first message.
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
  return z.object({ body: bodyField(t) });
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
