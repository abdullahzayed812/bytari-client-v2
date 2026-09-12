import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Veterinarian Store stack — home → products → detail → cart → checkout → order. */
export default function VeterinarianStoreLayout() {
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
