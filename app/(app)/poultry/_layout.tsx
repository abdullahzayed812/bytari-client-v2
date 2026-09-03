import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Poultry Farms stack — landing → farm details → management sub-pages. */
export default function PoultryLayout() {
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
