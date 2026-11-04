import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card } from '@/components/content';
import { useToast } from '@/components/feedback';
import { Switch } from '@/components/forms';
import { Caption } from '@/components/typography';
import { useTheme } from '@/theme';

import { useOrgStoreOrderSettings, useUpdateOrgStoreOrderSettings } from '../hooks';
import { orgStoreErrorMessage } from '../utils';

interface Props {
  organizationId: string;
  /** `store.order.manage` (owner / admin / supervisor) — others see it read-only. */
  canManage: boolean;
}

/**
 * "استقبال الطلبات الجديدة" on a clinic's / office's Orders page. OFF stops
 * new carts and checkouts (server-enforced); existing orders stay manageable.
 */
export function OrderAvailabilityCard({ organizationId, canManage }: Props) {
  const theme = useTheme();
  const { t } = useTranslation('organizationStore');
  const toast = useToast();
  const settings = useOrgStoreOrderSettings(organizationId);
  const update = useUpdateOrgStoreOrderSettings(organizationId);
  const enabled = settings.data?.ordersEnabled !== false;

  return (
    <Card variant="outlined" padding="md">
      <View style={{ rowGap: theme.spacing.xs }}>
        <Switch
          label={t('orderSettings.title')}
          value={enabled}
          disabled={!canManage || settings.isLoading || update.isPending}
          onValueChange={(next) =>
            update.mutate(next, {
              onSuccess: () =>
                toast.show({
                  tone: 'success',
                  message: t(next ? 'orderSettings.enabled' : 'orderSettings.disabled'),
                }),
              onError: (e) => toast.show({ tone: 'danger', message: orgStoreErrorMessage(e, t) }),
            })
          }
        />
        <Caption>{t(enabled ? 'orderSettings.onHint' : 'orderSettings.offHint')}</Caption>
      </View>
    </Card>
  );
}
