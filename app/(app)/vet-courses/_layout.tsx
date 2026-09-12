import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Veterinarian Courses & Seminars stack — list → details / register / my courses / create. */
export default function VetCoursesLayout() {
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
