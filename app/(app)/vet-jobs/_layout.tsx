import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Veterinarian Jobs stack — home → offers / seekers / my ads & applications. */
export default function VetJobsLayout() {
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
