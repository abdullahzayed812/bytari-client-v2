/**
 * Shared cross-feature types. Feature-specific types live in
 * `features/<feature>/types.ts`.
 */
export type {
  AuthUser,
  AuthTokens,
  SessionSnapshot,
  RoleKey,
  SupervisorDomain,
  UserStatus,
  VeterinarianStatus,
} from '@/services/auth';
export type { PageMeta, ApiSuccess, ApiErrorDetail } from '@/services/api';
export type { AppMode } from '@/store';
export type { AppLanguage } from '@/i18n';

/** A value that is either loading, an error, or loaded data. */
export type AsyncState<T> =
  { status: 'loading' } | { status: 'error'; error: unknown } | { status: 'success'; data: T };
