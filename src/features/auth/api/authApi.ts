import { apiClient } from '@/services/api';

import type {
  AuthResult,
  LoginInput,
  LogoutAllResult,
  LogoutResult,
  RefreshResult,
  RegisterInput,
  SessionSnapshot,
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
  /** `POST /auth/register` → 201 `{ user, tokens }`. Errors: 409 dup, 422, 429. */
  register(input: RegisterInput): Promise<AuthResult> {
    return apiClient.post<AuthResult>('/auth/register', input, { anonymous: true });
  },

  /** `POST /auth/login` → 200 `{ user, tokens }`. Errors: 401 creds, 403 inactive, 422, 429. */
  login(input: LoginInput): Promise<AuthResult> {
    return apiClient.post<AuthResult>('/auth/login', input, { anonymous: true });
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
