import { create } from 'zustand';

import { createLogger } from '@/lib/logger';
import { configureApiAuth, isApiError } from '@/services/api';

import { authApi } from '../api';
import { tokenStorage } from '../services';
import type {
  AuthResult,
  AuthStatus,
  AuthTokens,
  LoginInput,
  RegisterInput,
  ResendVerificationResult,
  SessionSnapshot,
  User,
  VerifyEmailInput,
} from '../types';

const log = createLogger('auth-store');

/**
 * The single source of truth for the authentication session (§21).
 *
 *   status: 'bootstrapping'         → app just launched, restoring persisted session
 *         | 'authenticated'         → a valid session + `/auth/me` snapshot are loaded
 *         | 'pending-verification'  → registered but the email is not verified yet
 *                                     (see `AuthStatus`'s own doc comment)
 *         | 'unauthenticated'       → no session; show the auth flow
 *
 * No screen keeps its own auth state. Tokens live in `expo-secure-store` (via
 * `tokenStorage`); only the in-memory mirror is here and it is never persisted
 * by Zustand.
 */
interface AuthState {
  status: AuthStatus;
  user: User | null;
  /** Authoritative identity + capability snapshot from `GET /auth/me`. Populated even `pending-verification` — `/auth/me` is allowlisted for that state. */
  session: SessionSnapshot | null;
  /** In-memory mirror of the secure-store token pair. */
  tokens: AuthTokens | null;

  /** App-start session restore. Idempotent — safe to call repeatedly. */
  initialize: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  /** Does NOT reach `authenticated` on its own — see `AuthResult`/`AuthStatus` doc comments. Screens read `email` back off `user`/`session`, not this call's return value. */
  register: (input: RegisterInput) => Promise<void>;
  /** Completes registration: correct code → `ACTIVE` + a full, unrestricted session. */
  verifyEmail: (input: VerifyEmailInput) => Promise<void>;
  /** Thin passthrough — the screen uses the result to drive its own resend-cooldown countdown. */
  resendVerification: (email: string) => Promise<ResendVerificationResult>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  /** Re-pull `/auth/me` (after vet approval, role change, resume). */
  refreshSession: () => Promise<void>;
}

/** `authenticated` for an ACTIVE user, `pending-verification` for an unverified one. */
function statusForUser(user: User): Extract<AuthStatus, 'authenticated' | 'pending-verification'> {
  return user.status === 'PENDING_VERIFICATION' ? 'pending-verification' : 'authenticated';
}

let initializePromise: Promise<void> | null = null;

/**
 * Best-effort tasks run once, while the session is still valid, at the start of
 * an explicit `logout()` / `logoutAll()` (never on silent session-expiry). A
 * task failure is swallowed and never blocks sign-out (§33). Used by
 * `NotificationsGate` to unregister this device's push token.
 */
type LogoutTask = () => void | Promise<void>;
const logoutTasks = new Set<LogoutTask>();

export function onBeforeLogout(task: LogoutTask): () => void {
  logoutTasks.add(task);
  return () => logoutTasks.delete(task);
}

async function runLogoutTasks(): Promise<void> {
  for (const task of [...logoutTasks]) {
    try {
      await task();
    } catch (error) {
      log.warn('pre-logout task failed — continuing sign-out', { reason: describe(error) });
    }
  }
}

export const useAuthStore = create<AuthState>((set, get) => {
  /**
   * Persist tokens + load the `/auth/me` snapshot, then mark
   * `authenticated` OR `pending-verification` depending on `session.user.status`
   * (NOT always `authenticated` — a `register()` token is real but scoped;
   * see `AuthResult`'s doc comment). `/auth/me` itself is allowlisted for a
   * `PENDING_VERIFICATION` account, so this always succeeds either way.
   */
  async function establishSession(result: AuthResult): Promise<void> {
    await tokenStorage.saveTokens(result.tokens);
    set({ tokens: result.tokens, user: result.user });
    const session = await authApi.me();
    set({ session, user: session.user, status: statusForUser(session.user) });
  }

  async function teardown(): Promise<void> {
    await tokenStorage.clearTokens();
    set({ status: 'unauthenticated', user: null, session: null, tokens: null });
  }

  return {
    status: 'bootstrapping',
    user: null,
    session: null,
    tokens: null,

    initialize: () => {
      initializePromise ??= (async () => {
        try {
          const stored = await tokenStorage.getStoredTokens();
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
            const session = await authApi.me();
            set({ session, user: session.user, status: statusForUser(session.user) });
          } catch (error) {
            // Access token likely expired — attempt exactly one refresh.
            if (isApiError(error) && error.isAuthError) {
              const { tokens } = await authApi.refresh(stored.refreshToken);
              await tokenStorage.saveTokens(tokens);
              set({ tokens });
              const session = await authApi.me();
              set({ session, user: session.user, status: statusForUser(session.user) });
            } else {
              throw error;
            }
          }
        } catch (error) {
          log.info('session restore failed — signing out', { reason: describe(error) });
          await teardown();
        }
      })().finally(() => {
        initializePromise = null;
      });
      return initializePromise;
    },

    login: async (input) => {
      const result = await authApi.login(input);
      await establishSession(result);
    },

    // NOTE: this genuinely does not always leave `status: 'authenticated'` —
    // see `AuthState.register`'s doc comment.
    register: async (input) => {
      const result = await authApi.register(input);
      await establishSession(result);
    },

    verifyEmail: async (input) => {
      const result = await authApi.verifyEmail(input);
      await establishSession(result);
    },

    resendVerification: (email) => authApi.resendVerification(email),

    logout: async () => {
      const { tokens } = get();
      await runLogoutTasks();
      try {
        if (tokens) await authApi.logout(tokens.refreshToken);
      } catch (error) {
        log.warn('logout call failed — clearing locally anyway', { reason: describe(error) });
      }
      await teardown();
    },

    logoutAll: async () => {
      await runLogoutTasks();
      try {
        await authApi.logoutAll();
      } catch (error) {
        log.warn('logout-all failed — clearing locally anyway', { reason: describe(error) });
      }
      await teardown();
    },

    refreshSession: async () => {
      if (get().status !== 'authenticated') return;
      try {
        const session = await authApi.me();
        set({ session, user: session.user });
      } catch (error) {
        if (isApiError(error) && error.isAuthError) await teardown();
      }
    },
  };
});

function describe(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown';
}

// --- wire the API client's auth bridge (single-flight refresh lives there) ---
configureApiAuth({
  getAccessToken: () => useAuthStore.getState().tokens?.accessToken ?? null,

  /** Rotate tokens. Identity is unchanged, so `user`/`session` are left intact. */
  refresh: async () => {
    const current = useAuthStore.getState().tokens;
    if (!current) return null;
    try {
      const { tokens } = await authApi.refresh(current.refreshToken);
      await tokenStorage.saveTokens(tokens);
      useAuthStore.setState({ tokens });
      return tokens.accessToken;
    } catch {
      return null;
    }
  },

  onSessionExpired: () => {
    const { status } = useAuthStore.getState();
    // Includes `pending-verification`: that token IS real (just scoped — see
    // `AuthResult`'s doc comment), so it can still genuinely expire/get
    // revoked, and a dead session must not be left sitting in state forever.
    if (status === 'bootstrapping' || status === 'authenticated' || status === 'pending-verification') {
      log.info('session expired — forcing sign-out');
      void tokenStorage.clearTokens();
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
export const selectIsBootstrapping = (s: AuthState): boolean => s.status === 'bootstrapping';
export const selectRequiresEmailVerification = (s: AuthState): boolean =>
  s.status === 'pending-verification';
export const selectSession = (s: AuthState): SessionSnapshot | null => s.session;
export type { AuthState };
