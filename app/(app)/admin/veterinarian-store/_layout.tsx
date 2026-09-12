import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Veterinarian Store admin stack (Management Centre → Veterinarian Store). */
export default function VeterinarianStoreAdminLayout() {
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
