import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Global Chat stack — rooms list → room info / thread / report. */
export default function GlobalChatLayout() {
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
