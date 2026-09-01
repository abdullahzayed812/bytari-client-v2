import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Veterinarian stack: Veterinarian Home → apply (re-apply). */
export default function VeterinarianLayout() {
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
