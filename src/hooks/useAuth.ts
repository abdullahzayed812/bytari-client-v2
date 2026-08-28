import { useMemo } from 'react';

import type { AuthUser, SessionSnapshot } from '@/services/auth';
import { useAuthStore, type AuthStatus } from '@/store';

export interface UseAuth {
  status: AuthStatus;
  isAuthenticated: boolean;
  isRestoring: boolean;
  user: AuthUser | null;
  session: SessionSnapshot | null;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  signOutEverywhere: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

/** Ergonomic access to the auth session + actions. */
export function useAuth(): UseAuth {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const signIn = useAuthStore((s) => s.signIn);
  const register = useAuthStore((s) => s.register);
  const signOut = useAuthStore((s) => s.signOut);
  const signOutEverywhere = useAuthStore((s) => s.signOutEverywhere);
  const refreshSession = useAuthStore((s) => s.refreshSession);

  return useMemo(
    () => ({
      status,
      isAuthenticated: status === 'authenticated',
      isRestoring: status === 'restoring' || status === 'idle',
      user,
      session,
      signIn,
      register,
      signOut,
      signOutEverywhere,
      refreshSession,
    }),
    [status, user, session, signIn, register, signOut, signOutEverywhere, refreshSession],
  );
}
