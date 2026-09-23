import { i18n } from '@/i18n';
import { ApiError, ApiErrorCode } from '@/services/api';

/**
 * Maps a thrown error to a safe, user-facing **Arabic** message.
 *
 *   backend error code / HTTP status  →  mobile mapping  →  Arabic string
 *
 * Never surfaces stack traces, DB errors, tokens, or raw exceptions. Unknown
 * failures fall back to a generic message. Distinguishes the cases the brief
 * calls out (§20): invalid credentials · validation · unauthorized · session
 * expired · server error · network unavailable · timeout.
 */
export type AuthErrorContext = 'login' | 'register' | 'generic';

export function authErrorMessage(error: unknown, context: AuthErrorContext = 'generic'): string {
  const t = i18n.getFixedT(null, 'errors');

  if (!(error instanceof ApiError)) {
    return t('generic');
  }

  // transport-level
  if (error.code === ApiErrorCode.NETWORK_ERROR) return t('network');
  if (error.code === ApiErrorCode.TIMEOUT) return t('timeout');

  // server-side
  if (error.status >= 500 || error.code === ApiErrorCode.SERVICE_UNAVAILABLE) {
    return t('serverError');
  }

  switch (error.code) {
    case ApiErrorCode.INVALID_CREDENTIALS:
      return t('invalidCredentials');
    case ApiErrorCode.ACCOUNT_INACTIVE:
      return t('accountInactive');
    case ApiErrorCode.EMAIL_VERIFICATION_REQUIRED:
      return t('emailVerificationRequired');
    case ApiErrorCode.INVALID_VERIFICATION_CODE:
      return t('invalidVerificationCode');
    case ApiErrorCode.VERIFICATION_CODE_EXPIRED:
      return t('verificationCodeExpired');
    case ApiErrorCode.TOO_MANY_VERIFICATION_ATTEMPTS:
      return t('tooManyVerificationAttempts');
    case ApiErrorCode.INVALID_TOKEN:
    case ApiErrorCode.INVALID_REFRESH_TOKEN:
      return t('sessionExpired');
    case ApiErrorCode.RATE_LIMITED:
      return t('rateLimited');
    case ApiErrorCode.CONFLICT:
      return context === 'register' ? t('emailTaken') : t('conflict');
    case ApiErrorCode.VALIDATION_ERROR:
      return firstFieldMessage(error) ?? t('validation');
    case ApiErrorCode.FORBIDDEN:
    case ApiErrorCode.PERMISSION_DENIED:
      return t('forbidden');
    default:
      return t('generic');
  }
}

/**
 * Per-field messages for a 422, keyed by dotted path from the backend
 * (`body.email`, `body.password`, …). Consumed by the form screens to show
 * errors inline.
 */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.details) return {};
  const t = i18n.getFixedT(null, 'errors');
  const out: Record<string, string> = {};
  for (const detail of error.details) {
    const field = detail.path?.replace(/^body\./, '');
    if (!field) continue;
    out[field] = translateFieldRule(field, detail.rule) ?? detail.message;
  }
  void t;
  return out;
}

function firstFieldMessage(error: ApiError): string | undefined {
  const map = fieldErrors(error);
  const first = Object.values(map)[0];
  return first;
}

function translateFieldRule(field: string, rule?: string): string | undefined {
  const t = i18n.getFixedT(null, 'auth');
  if (field === 'email') return t('errors.emailInvalid');
  if (field === 'password') {
    return rule === 'too_small' ? t('errors.passwordTooShort') : t('errors.passwordInvalid');
  }
  if (field === 'firstName' || field === 'lastName') return t('errors.nameRequired');
  if (field === 'phone') return t('errors.phoneInvalid');
  return undefined;
}
