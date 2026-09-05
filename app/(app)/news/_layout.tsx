import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** News stack — list → detail (آخر الأخبار). */
export default function NewsLayout() {
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
