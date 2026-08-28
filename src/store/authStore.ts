import { create } from 'zustand';

import { createLogger } from '@/lib/logger';
import { configureApiAuth, isApiError } from '@/services/api';
import {
  authService,
  clearTokens,
  loadTokens,
  saveTokens,
  type AuthResult,
  type AuthTokens,
  type AuthUser,
  type LoginInput,
  type RegisterInput,
  type SessionSnapshot,
} from '@/services/auth';

const log = createLogger('auth-store');

export type AuthStatus = 'idle' | 'restoring' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  /** Authoritative capability snapshot from `GET /auth/me`. */
  session: SessionSnapshot | null;
  /** In-memory only. The durable copy lives in expo-secure-store. */
  tokens: AuthTokens | null;
  lastError: string | null;

  bootstrap: () => Promise<void>;
  signIn: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  signOutEverywhere: () => Promise<void>;
  /** Re-fetch `/auth/me` (e.g. after vet approval, role change, on resume). */
  refreshSession: () => Promise<void>;
}

let bootstrapPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => {
  async function applyResult(result: AuthResult): Promise<void> {
    await saveTokens(result.tokens);
    set({ tokens: result.tokens, user: result.user, lastError: null });
    const session = await authService.me();
    set({ session, user: session.user, status: 'authenticated' });
  }

  async function teardown(status: Exclude<AuthStatus, 'authenticated'>): Promise<void> {
    await clearTokens();
    set({ status, user: null, session: null, tokens: null });
  }

  return {
    status: 'idle',
    user: null,
    session: null,
    tokens: null,
    lastError: null,

    bootstrap: () => {
      bootstrapPromise ??= (async () => {
        set({ status: 'restoring' });
        try {
          const stored = await loadTokens();
          if (!stored) {
            set({ status: 'unauthenticated' });
            return;
          }
          set({
            tokens: {
              accessToken: stored.accessToken,
              refreshToken: stored.refreshToken,
              tokenType: stored.meta.tokenType,
              expiresIn: stored.meta.expiresIn,
            },
          });
          try {
            const session = await authService.me();
            set({ session, user: session.user, status: 'authenticated' });
          } catch (error) {
            // access token likely expired — try one refresh
            if (isApiError(error) && error.isAuthError) {
              const refreshed = await authService.refresh(stored.refreshToken);
              await applyResult(refreshed);
            } else {
              throw error;
            }
          }
        } catch (error) {
          log.info('session restore failed — signing out', {
            reason: error instanceof Error ? error.message : 'unknown',
          });
          await teardown('unauthenticated');
        }
      })().finally(() => {
        bootstrapPromise = null;
      });
      return bootstrapPromise;
    },

    signIn: async (input) => {
      const result = await authService.login(input);
      await applyResult(result);
    },

    register: async (input) => {
      const result = await authService.register(input);
      await applyResult(result);
    },

    signOut: async () => {
      const { tokens } = get();
      try {
        if (tokens) await authService.logout(tokens.refreshToken);
      } catch (error) {
        log.warn('logout call failed — clearing locally anyway', {
          reason: error instanceof Error ? error.message : 'unknown',
        });
      }
      await teardown('unauthenticated');
    },

    signOutEverywhere: async () => {
      try {
        await authService.logoutAll();
      } catch (error) {
        log.warn('logout-all failed — clearing locally anyway', {
          reason: error instanceof Error ? error.message : 'unknown',
        });
      }
      await teardown('unauthenticated');
    },

    refreshSession: async () => {
      if (get().status !== 'authenticated') return;
      try {
        const session = await authService.me();
        set({ session, user: session.user });
      } catch (error) {
        if (isApiError(error) && error.isAuthError) {
          await teardown('unauthenticated');
        }
      }
    },
  };
});

// --- wire the API layer's auth bridge (single registration) ---------------
configureApiAuth({
  getAccessToken: () => useAuthStore.getState().tokens?.accessToken ?? null,
  refresh: async () => {
    const { tokens } = useAuthStore.getState();
    if (!tokens) return null;
    try {
      const result = await authService.refresh(tokens.refreshToken);
      await saveTokens(result.tokens);
      useAuthStore.setState({ tokens: result.tokens, user: result.user });
      return result.tokens.accessToken;
    } catch {
      return null;
    }
  },
  onSessionExpired: () => {
    const { status } = useAuthStore.getState();
    if (status === 'authenticated' || status === 'restoring') {
      log.info('session expired — forcing sign-out');
      void clearTokens();
      useAuthStore.setState({
        status: 'unauthenticated',
        user: null,
        session: null,
        tokens: null,
      });
    }
  },
});

// --- selectors ----------------------------------------------------------
export const selectIsAuthenticated = (s: AuthState): boolean => s.status === 'authenticated';
export const selectSession = (s: AuthState): SessionSnapshot | null => s.session;
