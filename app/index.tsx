import { Redirect } from 'expo-router';

import { useAuth } from '@/hooks';

/**
 * Entry route. Bootstrapping is already done by the time this renders (root
 * layout gates on it), so a straight redirect is safe.
 */
export default function Index() {
  const { isAuthenticated } = useAuth();
  return <Redirect href={isAuthenticated ? '/(app)/(tabs)' : '/(auth)/sign-in'} />;
}
