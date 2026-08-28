import { Redirect, Stack } from 'expo-router';

import { Loading } from '@/components/feedback';
import { useAuth, useCapabilities } from '@/hooks';
import { useTheme } from '@/theme';

/**
 * Internal Control Centre group (Admin + System Supervisor).
 *
 * Access is gated here on the authoritative `/auth/me` capability snapshot — but
 * this is UX routing, not security: every admin/supervisor API the screens will
 * call is independently authorised by the backend.
 */
export default function AdminLayout() {
  const theme = useTheme();
  const { isRestoring } = useAuth();
  const { canAccessControlCentre, isReady } = useCapabilities();

  if (isRestoring || !isReady) return <Loading fill />;
  if (!canAccessControlCentre) return <Redirect href="/(app)/(tabs)" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
