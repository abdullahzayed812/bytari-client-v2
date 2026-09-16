import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { EmptyState } from '@/components/feedback';
import { AppHeader } from '@/components/navigation';
import { useTheme } from '@/theme';

import { VeterinaryOfficeDashboardShell } from '../components';

/**
 * Route `/vet-office-dashboard/[organizationId]/orders` — "الطلبات".
 * Stub: office products are catalog-only (browse + contact the office); no
 * orders/checkout system exists for them yet, and no screenshot specifies this
 * screen's content — a placeholder, not invented functionality.
 */
export default function VeterinaryOfficeOrdersScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOfficeDashboard');
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();

  return (
    <VeterinaryOfficeDashboardShell organizationId={organizationId ?? ''} active="orders">
      <AppHeader title={t('orders.title')} showBack />
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: theme.screenPadding }}>
        <EmptyState
          icon="receipt-outline"
          title={t('orders.comingSoonTitle')}
          message={t('orders.comingSoonBody')}
        />
      </View>
    </VeterinaryOfficeDashboardShell>
  );
}
