import { Stack, useLocalSearchParams } from 'expo-router';

import { ClinicOperationalGate } from '@/features/clinicDashboard/components';
import { useTheme } from '@/theme';

/**
 * Clinic animal / medical / reminder screens (all clinic-only) render behind
 * the clinic operability gate, so a deep link into a pending or expired
 * clinic's patient files shows the matching state instead. The backend
 * enforces the same rule on every API call.
 */
export default function ClinicAnimalsLayout() {
  const theme = useTheme();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  return (
    <ClinicOperationalGate organizationId={organizationId ?? ''}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      />
    </ClinicOperationalGate>
  );
}
