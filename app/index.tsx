import { Redirect } from 'expo-router';

import { Routes } from '@/constants/routes';
import { useAuth } from '@/hooks';

/**
 * Entry route. Bootstrapping is already done by the time this renders (root
 * layout gates on it), so a straight redirect is safe. Signed-out users land
 * on Welcome first — Sign in / Create account / Browse as guest — not
 * straight on the sign-in form.
 */
export default function Index() {
  const { isAuthenticated } = useAuth();
  return <Redirect href={isAuthenticated ? Routes.home : Routes.authWelcome} />;
}
