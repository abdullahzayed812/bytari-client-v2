import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Pet Owners Store stack — home → products → detail → cart → checkout → order. */
export default function PetOwnerStoreLayout() {
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
