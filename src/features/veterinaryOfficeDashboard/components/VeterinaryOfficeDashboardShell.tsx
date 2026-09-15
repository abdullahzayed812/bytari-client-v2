import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { VeterinaryOfficeDashboardTabBar, type VeterinaryOfficeDashboardTab } from './VeterinaryOfficeDashboardTabBar';

export interface VeterinaryOfficeDashboardShellProps {
  organizationId: string;
  active: VeterinaryOfficeDashboardTab;
  children: ReactNode;
}

/** Wraps every Veterinary Office Dashboard screen with the shared 5-tab bottom bar. */
export function VeterinaryOfficeDashboardShell({
  organizationId,
  active,
  children,
}: VeterinaryOfficeDashboardShellProps) {
  const theme = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1 }}>{children}</View>
      <VeterinaryOfficeDashboardTabBar organizationId={organizationId} active={active} />
    </SafeAreaView>
  );
}
