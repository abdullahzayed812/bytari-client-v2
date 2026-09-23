/**
 * Authentication & identity feature — the public surface.
 *
 * Screens import from here (or the sub-barrels). Low-level pieces (token
 * storage, the store, the raw API) are exported for wiring/tests only; screens
 * must go through `useAuth()` / the mutation hooks.
 */
export { useAuth, type UseAuth } from './hooks/useAuth';
export {
  useLoginMutation,
  useRegisterMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useLogoutMutation,
  useLogoutAllMutation,
} from './hooks/useAuthMutations';
export { useVeterinarianStatus, type VeterinarianStatusInfo } from './hooks/useVeterinarianStatus';

export { authErrorMessage, fieldErrors, type AuthErrorContext } from './errors';
export { AuthScreenLayout, FormField, VeterinarianStatusBadge } from './components';
export { LoginScreen, RegisterScreen } from './screens';

export { authApi, type AuthApi } from './api';
export {
  useAuthStore,
  selectIsAuthenticated,
  selectIsBootstrapping,
  selectRequiresEmailVerification,
  selectSession,
  type AuthState,
} from './store';
export { tokenStorage, isAccessTokenNearExpiry } from './services';

export type {
  AuthStatus,
  AuthTokens,
  AuthResult,
  RegisterResult,
  ResendVerificationResult,
  RefreshResult,
  LoginInput,
  RegisterInput,
  VerifyEmailInput,
  RoleKey,
  SessionSnapshot,
  SupervisorDomain,
  User,
  UserStatus,
  VeterinarianStatus,
  Gender,
} from './types';
