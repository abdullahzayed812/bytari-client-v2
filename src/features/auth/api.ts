/**
 * The `auth` feature's backend surface already lives in `@/services/auth`
 * (it is cross-cutting infrastructure, not a screen-level feature). This file
 * exists so the `features/` structure is consistent and discoverable.
 *
 * Re-export the service so a future auth *screen module* imports from one place.
 */
export { authService } from '@/services/auth/authService';
export type { AuthResult, LoginInput, RegisterInput, SessionSnapshot } from '@/services/auth/types';
