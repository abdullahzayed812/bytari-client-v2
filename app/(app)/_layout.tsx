import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/**
 * Authenticated area. Sub-groups:
 *  - `(tabs)`   → the shared five-tab shell (owner / vet experiences live here
 *                 and read `useAppMode()` to decide what to show — later phases)
 *  - `admin`    → the internal Control Centre for admins / system supervisors
 *  - `showcase` → dev-only design system screen
 *
 * The auth gate itself is `AuthRedirector` in the root layout.
 */
export default function AppLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="showcase" options={{ presentation: 'card' }} />
    </Stack>
  );
}
