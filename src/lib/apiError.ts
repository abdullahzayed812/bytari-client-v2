import { i18n } from '@/i18n';
import { ApiError, ApiErrorCode } from '@/services/api';

/**
 * Generic, feature-agnostic mapping of a thrown value to a safe Arabic message.
 *
 *   backend error code / HTTP status  →  mobile mapping  →  Arabic string
 *
 * Never surfaces stack traces, DB errors, tokens, or raw backend text. Unknown
 * failures fall back to a generic message. Feature-specific mappers (e.g.
 * `authErrorMessage`) may layer their own cases on top and delegate here.
 */
export function apiErrorMessage(error: unknown): string {
  const t = i18n.getFixedT(null, 'errors');
  if (!(error instanceof ApiError)) return t('generic');

  if (error.code === ApiErrorCode.NETWORK_ERROR) return t('network');
  if (error.code === ApiErrorCode.TIMEOUT) return t('timeout');
  if (error.status >= 500 || error.code === ApiErrorCode.SERVICE_UNAVAILABLE) {
    return t('serverError');
  }

  switch (error.code) {
    case ApiErrorCode.INVALID_TOKEN:
    case ApiErrorCode.INVALID_REFRESH_TOKEN:
    case ApiErrorCode.UNAUTHORIZED:
      return t('sessionExpired');
    case ApiErrorCode.ACCOUNT_INACTIVE:
      return t('accountInactive');
    case ApiErrorCode.VETERINARIAN_ACCOUNT_PENDING_APPROVAL:
      return t('veterinarianPendingApproval');
    case ApiErrorCode.FORBIDDEN:
    case ApiErrorCode.PERMISSION_DENIED:
      return t('forbidden');
    case ApiErrorCode.NOT_FOUND:
      return t('notFound');
    case ApiErrorCode.CONFLICT:
      return t('conflict');
    case ApiErrorCode.RATE_LIMITED:
      return t('rateLimited');
    case ApiErrorCode.VALIDATION_ERROR:
      return firstFieldMessage(error) ?? t('validation');
    default:
      return error.status === 404
        ? t('notFound')
        : error.status === 403
          ? t('forbidden')
          : t('generic');
  }
}

/**
 * Per-field messages for a 422, keyed by the dotted backend path with the
 * leading `body.` stripped (`body.name` → `name`). Consumed by form screens to
 * show errors inline.
 */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.details) return {};
  const out: Record<string, string> = {};
  for (const detail of error.details) {
    const field = detail.path?.replace(/^body\./, '');
    if (field && !(field in out)) out[field] = detail.message;
  }
  return out;
}

function firstFieldMessage(error: ApiError): string | undefined {
  return Object.values(fieldErrors(error))[0];
}
