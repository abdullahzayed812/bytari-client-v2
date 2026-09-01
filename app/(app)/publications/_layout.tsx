import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Animal community stack: browse (adoption / mating / lost) → publication detail. */
export default function PublicationsLayout() {
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
