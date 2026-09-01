/**
 * Re-export of the auth feature's public hook. Kept at `@/hooks/useAuth` so
 * generic call sites have a stable path; the implementation lives in
 * `@/features/auth`.
 */
export { useAuth, type UseAuth } from '@/features/auth/hooks/useAuth';
