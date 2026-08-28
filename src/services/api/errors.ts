import { ApiErrorCode, type ApiErrorCodeValue, type ApiErrorDetail } from './types';

interface ApiErrorInit {
  code: ApiErrorCodeValue;
  message: string;
  status: number;
  requestId?: string;
  details?: ApiErrorDetail[];
  cause?: unknown;
}

/**
 * The single error type the rest of the app catches. Every failure from the API
 * layer — HTTP error envelope, network failure, timeout, unexpected shape — is
 * normalised into an `ApiError`. UI never sees a raw axios error.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCodeValue;
  readonly status: number;
  readonly requestId?: string;
  readonly details?: ApiErrorDetail[];

  constructor(init: ApiErrorInit) {
    super(init.message, { cause: init.cause });
    this.name = 'ApiError';
    this.code = init.code;
    this.status = init.status;
    this.requestId = init.requestId;
    this.details = init.details;
  }

  /** Missing/expired/invalid credentials — the session should be treated as gone. */
  get isAuthError(): boolean {
    return (
      this.status === 401 ||
      this.code === ApiErrorCode.INVALID_TOKEN ||
      this.code === ApiErrorCode.INVALID_REFRESH_TOKEN ||
      this.code === ApiErrorCode.ACCOUNT_INACTIVE
    );
  }

  get isPermissionError(): boolean {
    return this.status === 403;
  }

  get isValidationError(): boolean {
    return this.status === 422 || this.code === ApiErrorCode.VALIDATION_ERROR;
  }

  get isNetworkError(): boolean {
    return this.code === ApiErrorCode.NETWORK_ERROR || this.code === ApiErrorCode.TIMEOUT;
  }

  /** Safe to retry transparently. */
  get isRetryable(): boolean {
    return (
      this.isNetworkError ||
      this.status === 502 ||
      this.status === 503 ||
      this.status === 504 ||
      this.code === ApiErrorCode.SERVICE_UNAVAILABLE
    );
  }
}

export function networkError(cause?: unknown): ApiError {
  return new ApiError({
    code: ApiErrorCode.NETWORK_ERROR,
    message: 'Unable to reach the server. Check your connection and try again.',
    status: 0,
    cause,
  });
}

export function timeoutError(cause?: unknown): ApiError {
  return new ApiError({
    code: ApiErrorCode.TIMEOUT,
    message: 'The request took too long. Please try again.',
    status: 0,
    cause,
  });
}

export function unknownError(cause?: unknown): ApiError {
  return new ApiError({
    code: ApiErrorCode.UNKNOWN,
    message: 'Something went wrong. Please try again.',
    status: 0,
    cause,
  });
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}
