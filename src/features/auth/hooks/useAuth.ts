import { useMemo } from 'react';

import { useAuthStore } from '../store';
import type { LoginInput, RegisterInput, SessionSnapshot, User } from '../types';

/**
 * The public authentication interface for the whole app. Screens use this —
 * never the store, the API, or token storage directly (§3).
 */
export interface UseAuth {
  user: User | null;
  session: SessionSnapshot | null;
  isAuthenticated: boolean;
  /** App-start session restore in progress — gate the UI on this (§8). */
  isBootstrapping: boolean;
  /** Alias of `isBootstrapping` for call sites that think in "loading". */
  isLoading: boolean;

  initialize: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export function useAuth(): UseAuth {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const initialize = useAuthStore((s) => s.initialize);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const logoutAll = useAuthStore((s) => s.logoutAll);
  const refreshSession = useAuthStore((s) => s.refreshSession);

  return useMemo<UseAuth>(() => {
    const isBootstrapping = status === 'bootstrapping';
    return {
      user,
      session,
      isAuthenticated: status === 'authenticated',
      isBootstrapping,
      isLoading: isBootstrapping,
      initialize,
      login,
      register,
      logout,
      logoutAll,
      refreshSession,
    };
  }, [status, user, session, initialize, login, register, logout, logoutAll, refreshSession]);
}
