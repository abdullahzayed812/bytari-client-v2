import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { authApi } from '../api';
import { useAuthStore } from '../store';
import type {
  LoginInput,
  PasswordResetRequestResult,
  RegisterInput,
  ResendVerificationResult,
  ResetPasswordInput,
  ResetPasswordResult,
  VerifyEmailInput,
} from '../types';

/**
 * Thin React Query wrappers over the store's auth actions so screens get
 * `isPending` / `error` / `reset` ergonomically (§18, §23). The store remains
 * the single source of session truth; these do not cache anything.
 */
export function useLoginMutation(): UseMutationResult<void, unknown, LoginInput> {
  const login = useAuthStore((s) => s.login);
  return useMutation({ mutationKey: ['auth', 'login'], mutationFn: login });
}

export function useRegisterMutation(): UseMutationResult<void, unknown, RegisterInput> {
  const register = useAuthStore((s) => s.register);
  return useMutation({ mutationKey: ['auth', 'register'], mutationFn: register });
}

export function useVerifyEmailMutation(): UseMutationResult<void, unknown, VerifyEmailInput> {
  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  return useMutation({ mutationKey: ['auth', 'verify-email'], mutationFn: verifyEmail });
}

export function useResendVerificationMutation(): UseMutationResult<
  ResendVerificationResult,
  unknown,
  string
> {
  const resendVerification = useAuthStore((s) => s.resendVerification);
  return useMutation({
    mutationKey: ['auth', 'resend-verification'],
    mutationFn: resendVerification,
  });
}

export function useLogoutMutation(): UseMutationResult<void, unknown, void> {
  const logout = useAuthStore((s) => s.logout);
  return useMutation({ mutationKey: ['auth', 'logout'], mutationFn: () => logout() });
}

export function useLogoutAllMutation(): UseMutationResult<void, unknown, void> {
  const logoutAll = useAuthStore((s) => s.logoutAll);
  return useMutation({ mutationKey: ['auth', 'logout-all'], mutationFn: () => logoutAll() });
}

/** Forgot password step 1 — no session involved, so it bypasses the store. */
export function useForgotPasswordMutation(): UseMutationResult<
  PasswordResetRequestResult,
  unknown,
  string
> {
  return useMutation({
    mutationKey: ['auth', 'forgot-password'],
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });
}

/** Forgot password step 2 — sets the new password; the user then signs in normally. */
export function useResetPasswordMutation(): UseMutationResult<
  ResetPasswordResult,
  unknown,
  ResetPasswordInput
> {
  return useMutation({
    mutationKey: ['auth', 'reset-password'],
    mutationFn: (input: ResetPasswordInput) => authApi.resetPassword(input),
  });
}
