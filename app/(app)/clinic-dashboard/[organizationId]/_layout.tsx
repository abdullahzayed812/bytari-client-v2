import { Stack, useLocalSearchParams } from 'expo-router';

import { ClinicOperationalGate } from '@/features/clinicDashboard/components';
import { useTheme } from '@/theme';

/**
 * Every Clinic Dashboard screen renders behind the clinic operability gate
 * (pending / inactive / expired → the matching state screen), so deep links
 * and back navigation cannot expose it. The backend enforces the same rule on
 * every API call.
 */
export default function ClinicDashboardLayout() {
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
