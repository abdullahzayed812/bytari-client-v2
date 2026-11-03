import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '@/components/navigation';
import { StoreIncomingOrdersContent } from '@/features/organizationStore/screens/StoreIncomingOrdersScreen';

import { VeterinaryOfficeDashboardShell } from '../components';

/**
 * Route `/vet-office-dashboard/[organizationId]/orders` — "الطلبات": the
 * Veterinary Office Store's incoming orders (`store.order.read`), inside the
 * dashboard's own tab shell. Same list as the generic incoming-orders route.
 */
export default function VeterinaryOfficeOrdersScreen() {
  const { t } = useTranslation('organizationStore');
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  return (
    <VeterinaryOfficeDashboardShell organizationId={orgId} active="orders">
      <StoreIncomingOrdersContent
        organizationId={orgId}
        header={(name) => <AppHeader title={t('incoming.title')} subtitle={name} showBack />}
      />
    </VeterinaryOfficeDashboardShell>
  );
}
