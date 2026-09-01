import { router, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/hooks';

/**
 * The single authentication routing seam (§11, §24).
 *
 * - Unauthenticated inside `(app)`  → send to the auth flow.
 * - Authenticated inside `(auth)`   → send to the app.
 * - During `bootstrapping`          → do nothing (the splash is shown; avoids
 *                                     redirect races and login/app flicker).
 *
 * Nothing else in the tree performs auth redirects. Renders nothing.
 */
export function AuthRedirector() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isBootstrapping) return;
    const group = segments[0];
    const inAuthGroup = group === '(auth)';
    const inAppGroup = group === '(app)';

    if (!isAuthenticated && inAppGroup) {
      router.replace('/(auth)/sign-in');
    } else if (isAuthenticated && (inAuthGroup || group === undefined)) {
      router.replace('/(app)/(tabs)');
    }
  }, [isAuthenticated, isBootstrapping, segments]);

  return null;
}
