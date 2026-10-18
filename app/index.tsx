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
  // Signed-in users are sent on by `AuthRedirector` (which also honours a
  // pending deep link). A second replace from here would rebuild the whole
  // `(app)` subtree right after that one.
  if (isAuthenticated) return null;
  return <Redirect href={Routes.authWelcome} />;
}
