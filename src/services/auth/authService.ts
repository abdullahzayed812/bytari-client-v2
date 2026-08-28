import { apiClient } from '@/services/api';

import type { AuthResult, LoginInput, RegisterInput, SessionSnapshot } from './types';

/**
 * Stateless wrapper over the backend auth endpoints (`/api/v1/auth/*`).
 * Holds no state — the auth store owns the session lifecycle.
 */
export const authService = {
  register(input: RegisterInput): Promise<AuthResult> {
    return apiClient.post<AuthResult>('/auth/register', input, { anonymous: true });
  },

  login(input: LoginInput): Promise<AuthResult> {
    return apiClient.post<AuthResult>('/auth/login', input, { anonymous: true });
  },

  /** Rotates the refresh token; the backend revokes the presented one. */
  refresh(refreshToken: string): Promise<AuthResult> {
    return apiClient.post<AuthResult>(
      '/auth/refresh',
      { refreshToken },
      { anonymous: true, skipAuthRefresh: true },
    );
  },

  logout(refreshToken?: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>('/auth/logout', { refreshToken });
  },

  logoutAll(): Promise<{ success: boolean; revokedSessions: number }> {
    return apiClient.post<{ success: boolean; revokedSessions: number }>('/auth/logout-all');
  },

  /** Authoritative capability snapshot. Call after login and on app resume. */
  me(): Promise<SessionSnapshot> {
    return apiClient.get<SessionSnapshot>('/auth/me');
  },
};

export type AuthService = typeof authService;
