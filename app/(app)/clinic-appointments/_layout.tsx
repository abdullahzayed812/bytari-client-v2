import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Clinic appointments stack: list → details, plus the booking screen. */
export default function ClinicAppointmentsLayout() {
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
