import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Veterinary Syndicates stack — entry → syndicate home / branches / announcements / submissions. */
export default function SyndicatesLayout() {
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
