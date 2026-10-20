import { Stack, useLocalSearchParams } from 'expo-router';

import { ClinicOperationalGate } from '@/features/clinicDashboard/components';
import { useTheme } from '@/theme';

/**
 * Team management screens render behind the clinic operability gate, so the
 * staff / vets of a pending, suspended or subscription-expired clinic see the
 * restriction (and the renewal / contact path) instead of a failing list.
 * Non-clinic organizations pass straight through. The backend enforces the
 * same rule on every API call.
 */
export default function OrganizationTeamLayout() {
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
