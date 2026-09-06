import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Sheep Farms & Cattle Farms stack — landing → farm details → management sub-pages. */
export default function LivestockLayout() {
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
