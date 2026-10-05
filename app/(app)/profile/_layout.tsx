import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Profile sub-pages stack: edit profile / documents / my ads & requests. */
export default function ProfileLayout() {
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
