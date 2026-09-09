import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Pet Owners Store admin stack (Management Centre → Pet Store). */
export default function PetOwnerStoreAdminLayout() {
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
