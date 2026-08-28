import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

import { apiBaseUrl, env } from '@/lib/env';
import { createLogger } from '@/lib/logger';

import { ApiError, networkError, timeoutError, unknownError } from './errors';
import { ApiErrorCode, type ApiErrorBody, type ApiSuccess, type RequestOptions } from './types';

const log = createLogger('api');

/**
 * Bridge to the auth layer. Registered once at startup via `configureApiAuth`.
 * Keeping it an injected interface avoids an api ↔ auth import cycle.
 */
export interface ApiAuthBridge {
  getAccessToken(): string | null;
  /** Refresh the session. Resolves to the new access token, or `null` if it failed. */
  refresh(): Promise<string | null>;
  /** Called when the session is unrecoverable (refresh failed / no session). */
  onSessionExpired(): void;
}

let authBridge: ApiAuthBridge | null = null;
export function configureApiAuth(bridge: ApiAuthBridge): void {
  authBridge = bridge;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _options?: RequestOptions;
  _retried?: boolean;
}

// --- single-flight refresh -------------------------------------------------
let refreshInFlight: Promise<string | null> | null = null;
function refreshOnce(): Promise<string | null> {
  if (!authBridge) return Promise.resolve(null);
  refreshInFlight ??= authBridge
    .refresh()
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

// --- error normalisation -------------------------------------------------
function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!axios.isAxiosError(error)) return unknownError(error);

  const axiosErr = error as AxiosError<ApiErrorBody>;
  if (axiosErr.code === 'ECONNABORTED') return timeoutError(axiosErr);
  if (!axiosErr.response) return networkError(axiosErr);

  const { status, data } = axiosErr.response;
  const body = data?.error;
  return new ApiError({
    code: (body?.code as ApiError['code']) ?? ApiErrorCode.UNKNOWN,
    message: body?.message ?? `Request failed with status ${status}`,
    status,
    requestId: body?.requestId ?? headerValue(axiosErr.response.headers, 'x-request-id'),
    details: body?.details,
    cause: axiosErr,
  });
}

function headerValue(headers: unknown, key: string): string | undefined {
  if (headers instanceof AxiosHeaders) {
    const v = headers.get(key);
    return typeof v === 'string' ? v : undefined;
  }
  if (headers && typeof headers === 'object') {
    const v = (headers as Record<string, unknown>)[key];
    return typeof v === 'string' ? v : undefined;
  }
  return undefined;
}

// --- instance -----------------------------------------------------------
export function createHttpClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: apiBaseUrl,
    timeout: env.requestTimeoutMs,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  });

  instance.interceptors.request.use((config: RetriableConfig) => {
    const options = config._options;
    if (!options?.anonymous && authBridge) {
      const token = authBridge.getAccessToken();
      if (token) config.headers.set('Authorization', `Bearer ${token}`);
    }
    log.debug(`${config.method?.toUpperCase()} ${config.url}`);
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      const apiErr = normalizeError(error);

      const cfg = axios.isAxiosError(error)
        ? (error.config as RetriableConfig | undefined)
        : undefined;
      const canRetry =
        cfg &&
        apiErr.status === 401 &&
        !cfg._retried &&
        !cfg._options?.skipAuthRefresh &&
        !cfg._options?.anonymous &&
        authBridge != null;

      if (canRetry) {
        cfg._retried = true;
        const newToken = await refreshOnce();
        if (newToken) {
          cfg.headers = cfg.headers ?? new AxiosHeaders();
          cfg.headers.set('Authorization', `Bearer ${newToken}`);
          return instance.request(cfg);
        }
        authBridge?.onSessionExpired();
      } else if (apiErr.isAuthError && !cfg?._options?.anonymous) {
        authBridge?.onSessionExpired();
      }

      if (apiErr.status >= 500 || apiErr.isNetworkError) {
        log.warn('request failed', {
          status: apiErr.status,
          code: apiErr.code,
          requestId: apiErr.requestId,
        });
      }
      return Promise.reject(apiErr);
    },
  );

  return instance;
}

// --- typed request helper --------------------------------------------------
export class ApiClient {
  constructor(private readonly http: AxiosInstance = createHttpClient()) {}

  /** Raw axios instance — only for advanced cases (streaming, custom parsing). */
  get raw(): AxiosInstance {
    return this.http;
  }

  private async request<T>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T> {
    try {
      const res = await this.http.request<ApiSuccess<T>>({
        ...config,
        signal: options?.signal,
        // carried through to interceptors
        ...({ _options: options } as object),
      });
      return res.data.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /** Same as `request` but returns the full envelope (for paginated `meta`). */
  async requestEnvelope<T>(
    config: AxiosRequestConfig,
    options?: RequestOptions,
  ): Promise<ApiSuccess<T>> {
    try {
      const res = await this.http.request<ApiSuccess<T>>({
        ...config,
        signal: options?.signal,
        ...({ _options: options } as object),
      });
      return res.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  get<T>(url: string, params?: Record<string, unknown>, options?: RequestOptions): Promise<T> {
    return this.request<T>({ method: 'GET', url, params }, options);
  }

  post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>({ method: 'POST', url, data: body }, options);
  }

  patch<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>({ method: 'PATCH', url, data: body }, options);
  }

  put<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>({ method: 'PUT', url, data: body }, options);
  }

  delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>({ method: 'DELETE', url }, options);
  }
}

/** Process-wide API client. Feature modules import this, never axios directly. */
export const apiClient = new ApiClient();
