import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Contact ("تواصل معنا") stack. */
export default function ContactLayout() {
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
