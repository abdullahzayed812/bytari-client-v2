import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Organizations stack: My Organizations → Details → (Edit · Members · Supervisors), plus Create. */
export default function OrganizationsLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
