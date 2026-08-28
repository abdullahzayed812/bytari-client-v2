import { router, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/hooks';

/**
 * The single authentication routing seam.
 *
 * - Unauthenticated + inside `(app)` → send to sign-in.
 * - Authenticated + inside `(auth)` → send to the app home.
 *
 * Nothing else in the tree performs auth redirects. Renders nothing.
 */
export function AuthRedirector() {
  const { isAuthenticated, isRestoring } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isRestoring) return;
    const group = segments[0];
    const inAuthGroup = group === '(auth)';
    const inAppGroup = group === '(app)';

    if (!isAuthenticated && inAppGroup) {
      router.replace('/(auth)/sign-in');
    } else if (isAuthenticated && (inAuthGroup || group === undefined)) {
      router.replace('/(app)/(tabs)');
    }
  }, [isAuthenticated, isRestoring, segments]);

  return null;
}
