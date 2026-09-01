import type { TFunction } from 'i18next';
import { z } from 'zod';

/**
 * Client-side validation. Mirrors the backend contract EXACTLY
 * (`server/src/modules/auth/auth.schemas.ts` + `shared/validation/common.ts`) —
 * no invented fields, no stricter rules than the server.
 *
 *   register: email · password(≥10, ≤128) · firstName(1–100) · lastName(1–100) · phone?
 *   login:    email · password(≥1)
 *
 * Messages come from the `auth`-namespace `t` fn so they stay Arabic-localised.
 * The backend re-validates authoritatively; a 422 is mapped back to fields by
 * `fieldErrors()`.
 */
export type TFn = TFunction<'auth'>;

const PHONE_RE = /^\+?[0-9][0-9\s\-()]{5,23}$/;

export function buildLoginSchema(t: TFn) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, t('errors.emailRequired'))
      .email(t('errors.emailInvalid'))
      .max(254),
    password: z.string().min(1, t('errors.passwordRequired')).max(128),
  });
}

export function buildRegisterSchema(t: TFn) {
  return z.object({
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
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof buildLoginSchema>>;
export type RegisterFormValues = z.infer<ReturnType<typeof buildRegisterSchema>>;
