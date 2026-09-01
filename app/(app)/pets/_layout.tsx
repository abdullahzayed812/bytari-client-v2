import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Pet Owner stack: My Pets → Pet Details → Edit, plus Add Pet. */
export default function PetsLayout() {
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
