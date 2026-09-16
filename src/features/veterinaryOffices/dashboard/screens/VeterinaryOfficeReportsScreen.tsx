import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { EmptyState } from '@/components/feedback';
import { AppHeader } from '@/components/navigation';
import { useTheme } from '@/theme';

import { VeterinaryOfficeDashboardShell } from '../components';

/**
 * Route `/vet-office-dashboard/[organizationId]/reports` — "التقارير".
 * Stub: no reporting/analytics backend exists for office products yet, and no
 * screenshot specifies this screen's content — a placeholder, not invented
 * functionality.
 */
export default function VeterinaryOfficeReportsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOfficeDashboard');
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();

  return (
    <VeterinaryOfficeDashboardShell organizationId={organizationId ?? ''} active="reports">
      <AppHeader title={t('reports.title')} showBack />
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: theme.screenPadding }}>
        <EmptyState
          icon="bar-chart-outline"
          title={t('reports.comingSoonTitle')}
          message={t('reports.comingSoonBody')}
        />
      </View>
    </VeterinaryOfficeDashboardShell>
  );
}
