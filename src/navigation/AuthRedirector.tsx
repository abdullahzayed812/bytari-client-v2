import {
  router,
  useNavigationContainerRef,
  usePathname,
  useSegments,
  type Href,
} from 'expo-router';
import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks';

/**
 * The single authentication routing seam (§11, §24).
 *
 * - `pending-verification` (anywhere but the verify screen itself or the Pet
 *   Owner registration form it returns to) → send to `/(auth)/verify-email`.
 *   The form is allowed so "Back" from the verify screen can reach it without
 *   being bounced straight back (the form signs that scoped session out when
 *   it regains focus; the backend gates the token either way). Checked FIRST, ahead of the other two rules, so a
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
 * - Unauthenticated on `/(auth)/veterinarian-pending` → sign-in. That screen
 *   only means something for a signed-in account; without this rule its
 *   "تسجيل الخروج" cleared the session but left the user parked on it.
 * - Unauthenticated inside `(app)`  → send to the auth flow, remembering the
 *                                     requested path (a shared clinic / office
 *                                     link) so it opens right after sign-in.
 * - Authenticated inside `(auth)`   → send to the remembered path, else the app.
 * - During `bootstrapping`          → do nothing (the splash is shown; avoids
 *                                     redirect races and login/app flicker).
 *
 * Nothing else in the tree performs auth redirects. Renders nothing.
 */
type NavState = { index?: number; routes: { state?: unknown }[] } | undefined;
const hasNestedState = (state: NavState) => Boolean(state?.routes[state.index ?? 0]?.state);

/**
 * `true` once the navigation container's ROOT state — what expo-router's
 * `linkTo` reads via `navigationRef.getRootState()` — contains the root
 * `<Stack>`'s nested state. The container syncs that state after the commit
 * in which the Stack first mounts, so checking a navigator's own state is not
 * enough; listen to the container's `state` event instead.
 */
function useRootStackMounted(): boolean {
  const navigationRef = useNavigationContainerRef();
  const [mounted, setMounted] = useState(() => hasNestedState(readRootState(navigationRef)));
  useEffect(() => {
    if (mounted) return;
    const check = () => {
      if (hasNestedState(readRootState(navigationRef))) setMounted(true);
    };
    check();
    return navigationRef.addListener('state', check);
  }, [mounted, navigationRef]);
  return mounted;
}

function readRootState(ref: ReturnType<typeof useNavigationContainerRef>): NavState {
  return (ref.isReady() ? ref.getRootState() : undefined) as NavState;
}

/** A deep link that was opened while signed out — consumed on the next sign-in. */
let pendingDeepLink: string | null = null;
/**
 * Set once a session was authenticated in this app run. Leaving `(app)`
 * because the user signed out (or the session expired) is NOT a deep link:
 * remembering that screen made the next sign-in land on e.g. Notifications /
 * Settings instead of Home.
 */
let hadAuthenticatedSession = false;

export function AuthRedirector() {
  const {
    isAuthenticated,
    isBootstrapping,
    requiresEmailVerification,
    requiresVeterinarianApproval,
  } = useAuth();
  // Widened: the typed-routes tuple from .expo/types is absent in CI.
  const segments: string[] = useSegments();
  const pathname = usePathname();
  // `true` once the root `<Stack>` (mounted by the root layout when the splash
  // ends) has registered its state with expo-router's internal root navigator.
  // A `router.replace` issued before that — e.g. in the very commit the Stack
  // first mounts — finds no nested state, so expo-router targets its internal
  // root navigator and REPLACES the root route: the whole root layout
  // remounts and the brand splash plays a second time. Waiting one state
  // update avoids that.
  const rootStackMounted = useRootStackMounted();

  useEffect(() => {
    if (isBootstrapping || !rootStackMounted) return;
    if (isAuthenticated) hadAuthenticatedSession = true;
    const group = segments[0];
    const inAuthGroup = group === '(auth)';
    const inAppGroup = group === '(app)';
    const onVerificationFlow =
      inAuthGroup && (segments[1] === 'verify-email' || segments[1] === 'register');

    if (requiresEmailVerification) {
      if (!onVerificationFlow) router.replace('/(auth)/verify-email');
    } else if (requiresVeterinarianApproval) {
      const allowed =
        (inAuthGroup &&
          (segments[1] === 'veterinarian-pending' || segments[1] === 'register-veterinarian')) ||
        (inAppGroup && segments[1] === 'veterinarian' && segments[2] === 'apply');
      if (!allowed) router.replace('/(auth)/veterinarian-pending');
    } else if (!isAuthenticated && inAuthGroup && segments[1] === 'veterinarian-pending') {
      router.replace('/(auth)/sign-in');
    } else if (!isAuthenticated && inAppGroup) {
      // Only a link that OPENED the app signed-out is replayed after sign-in.
      if (!hadAuthenticatedSession && pathname && pathname !== '/') pendingDeepLink = pathname;
      router.replace('/(auth)/sign-in');
    } else if (isAuthenticated && (inAuthGroup || group === undefined)) {
      const target = pendingDeepLink;
      pendingDeepLink = null;
      router.replace((target ?? '/(app)/(tabs)') as Href);
    }
  }, [
    isAuthenticated,
    isBootstrapping,
    rootStackMounted,
    requiresEmailVerification,
    requiresVeterinarianApproval,
    segments,
    pathname,
  ]);

  return null;
}
