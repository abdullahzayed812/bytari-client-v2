import { Redirect, Stack } from 'expo-router';

import { Loading } from '@/components/feedback';
import { useManagementAccess } from '@/features/management';
import { useAuth } from '@/hooks';
import { useTheme } from '@/theme';

/**
 * Internal Management group (Admin + System Supervisor) — navigation guard (§24).
 *
 * Gated on the authoritative `/auth/me` snapshot. This is UX routing, not
 * security: every management API is independently authorised by the backend.
 */
export default function ManagementLayout() {
  const theme = useTheme();
  const { isBootstrapping } = useAuth();
  const { canAccess, isResolving } = useManagementAccess();

  if (isBootstrapping || isResolving) return <Loading fill />;
  if (!canAccess) return <Redirect href="/(app)/(tabs)" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
