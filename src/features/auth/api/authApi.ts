import { apiClient } from '@/services/api';

import type {
  AuthResult,
  LoginInput,
  LogoutAllResult,
  LogoutResult,
  RefreshResult,
  RegisterInput,
  RegisterResult,
  ResendVerificationResult,
  SessionSnapshot,
  VerifyEmailInput,
} from '../types';

/**
 * Thin, stateless wrappers over `/api/v1/auth/*`. No token logic here — the API
 * client attaches `Authorization` and handles refresh centrally; the auth store
 * owns session state.
 *
 * Contract verified against `server/src/modules/auth/auth.service.ts` +
 * `server/src/openapi/phase2.ts`.
 */
export const authApi = {
  /**
   * `POST /auth/register` → 201 `{ user, tokens, codeExpiresInSeconds }`. The
   * account starts `PENDING_VERIFICATION` — `tokens` IS present (see
   * `RegisterResult`'s doc comment) but is scoped, not a normal session.
   * Errors: 409 dup, 422, 429.
   */
  register(input: RegisterInput): Promise<RegisterResult> {
    return apiClient.post<RegisterResult>('/auth/register', input, { anonymous: true });
  },

  /**
   * `POST /auth/login` → 200 `{ user, tokens }`. Errors: 401 creds, 403
   * `ACCOUNT_INACTIVE` (suspended/deactivated) or 403
   * `EMAIL_VERIFICATION_REQUIRED` (correct password, unverified — NO tokens
   * issued either way), 422, 429.
   */
  login(input: LoginInput): Promise<AuthResult> {
    return apiClient.post<AuthResult>('/auth/login', input, { anonymous: true });
  },

  /**
   * `POST /auth/verify-email` → 200 `{ user, tokens }` — a normal,
   * unrestricted session (same shape `login` returns). Errors: 400
   * `INVALID_VERIFICATION_CODE` / `VERIFICATION_CODE_EXPIRED`, 429
   * `TOO_MANY_VERIFICATION_ATTEMPTS`.
   */
  verifyEmail(input: VerifyEmailInput): Promise<AuthResult> {
    return apiClient.post<AuthResult>('/auth/verify-email', input, { anonymous: true });
  },

  /**
   * `POST /auth/resend-verification` → always 200 (anti-enumeration — see
   * `ResendVerificationResult`'s doc comment). Errors: 429 `RATE_LIMITED`
   * (cooldown not yet elapsed).
   */
  resendVerification(email: string): Promise<ResendVerificationResult> {
    return apiClient.post<ResendVerificationResult>(
      '/auth/resend-verification',
      { email },
      { anonymous: true },
    );
  },

  /**
   * `POST /auth/refresh` → 200 `{ tokens }` — **no user**. Single-use: the
   * presented token is revoked; replay revokes every session for the user.
   */
  refresh(refreshToken: string): Promise<RefreshResult> {
    return apiClient.post<RefreshResult>(
      '/auth/refresh',
      { refreshToken },
      { anonymous: true, skipAuthRefresh: true },
    );
  },

  /** `POST /auth/logout` (bearer) → `{ success }`. Revokes the current session. */
  logout(refreshToken?: string): Promise<LogoutResult> {
    return apiClient.post<LogoutResult>('/auth/logout', refreshToken ? { refreshToken } : {});
  },

  /** `POST /auth/logout-all` (bearer) → `{ success, revokedSessions }`. */
  logoutAll(): Promise<LogoutAllResult> {
    return apiClient.post<LogoutAllResult>('/auth/logout-all');
  },

  /** `GET /auth/me` (bearer) → identity + capabilities snapshot. */
  me(): Promise<SessionSnapshot> {
    return apiClient.get<SessionSnapshot>('/auth/me');
  },
};

export type AuthApi = typeof authApi;
