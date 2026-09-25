import { router, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/hooks';

/**
 * The single authentication routing seam (§11, §24).
 *
 * - `pending-verification` (anywhere but the verify screen itself) → send to
 *   `/(auth)/verify-email`. Checked FIRST, ahead of the other two rules, so a
 *   `PENDING_VERIFICATION` session parked inside `(app)` (a stale token from
 *   before this flow existed, or one that outlives an app restart) can never
 *   fall through to "authenticated → let them stay" — the backend already
 *   refuses every non-allowlisted call for that status; this keeps the UI in
 *   sync with that instead of leaving the user stuck on a broken screen.
 * - `pending-approval` (a veterinarian-registered account not yet approved by
 *   an admin) → pinned to `/(auth)/veterinarian-pending`. The only other places
 *   it may be: the veterinarian registration screen (mid-flow — it is still
 *   uploading documents / submitting the application and navigates to the
 *   pending screen itself) and `/(app)/veterinarian/apply` (finish or redo the
 *   application). Every other route, including a manual deep link or a restart
 *   into `(app)`, is replaced. The server independently refuses every
 *   non-onboarding API with 403 `VETERINARIAN_ACCOUNT_PENDING_APPROVAL`.
 * - Unauthenticated inside `(app)`  → send to the auth flow.
 * - Authenticated inside `(auth)`   → send to the app.
 * - During `bootstrapping`          → do nothing (the splash is shown; avoids
 *                                     redirect races and login/app flicker).
 *
 * Nothing else in the tree performs auth redirects. Renders nothing.
 */
export function AuthRedirector() {
  const {
    isAuthenticated,
    isBootstrapping,
    requiresEmailVerification,
    requiresVeterinarianApproval,
  } = useAuth();
  // Widened: the typed-routes tuple from .expo/types is absent in CI.
  const segments: string[] = useSegments();

  useEffect(() => {
    if (isBootstrapping) return;
    const group = segments[0];
    const inAuthGroup = group === '(auth)';
    const inAppGroup = group === '(app)';
    const onVerifyEmailScreen = inAuthGroup && segments[1] === 'verify-email';

    if (requiresEmailVerification) {
      if (!onVerifyEmailScreen) router.replace('/(auth)/verify-email');
    } else if (requiresVeterinarianApproval) {
      const allowed =
        (inAuthGroup &&
          (segments[1] === 'veterinarian-pending' || segments[1] === 'register-veterinarian')) ||
        (inAppGroup && segments[1] === 'veterinarian' && segments[2] === 'apply');
      if (!allowed) router.replace('/(auth)/veterinarian-pending');
    } else if (!isAuthenticated && inAppGroup) {
      router.replace('/(auth)/sign-in');
    } else if (isAuthenticated && (inAuthGroup || group === undefined)) {
      router.replace('/(app)/(tabs)');
    }
  }, [
    isAuthenticated,
    isBootstrapping,
    requiresEmailVerification,
    requiresVeterinarianApproval,
    segments,
  ]);

  return null;
}
