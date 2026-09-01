/**
 * @deprecated Compatibility shim. Authentication moved to `@/features/auth` in
 * Mobile Phase 2. New code should import from `@/features/auth` directly.
 */
export {
  authApi,
  authApi as authService,
  tokenStorage,
  isAccessTokenNearExpiry,
  useAuthStore,
  selectIsAuthenticated,
  selectSession,
} from '@/features/auth';

export type {
  AuthStatus,
  AuthResult,
  AuthTokens,
  LoginInput,
  RegisterInput,
  RoleKey,
  SessionSnapshot,
  SupervisorDomain,
  User,
  User as AuthUser,
  UserStatus,
  VeterinarianStatus,
} from '@/features/auth';
