import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert, ConfirmationDialog, ErrorState, Loading, useToast } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { OrgStoreOrderDetailsBody } from '../components';
import { useCancelMyOrgStoreOrder, useMyOrgStoreOrder, useOrgStoreRealtime } from '../hooks';
import { orgStoreErrorMessage } from '../utils';

/** Route `/organization-store/orders/[orderId]` — the customer's order tracking. */
export default function OrganizationStoreOrderDetailsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizationStore');
  const toast = useToast();
  const { orderId, justPlaced } = useLocalSearchParams<{ orderId: string; justPlaced?: string }>();
  useOrgStoreRealtime();
  const q = useMyOrgStoreOrder(orderId);
  const cancel = useCancelMyOrgStoreOrder();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const order = q.data;
  const storeHref = (id: string, type: string) =>
    type === 'CLINIC' ? Routes.organizationDiscoverDetail(id) : Routes.veterinaryOfficeDetail(id);

  return (
    <SafeAreaScreen>
      <AppHeader
        title={order ? t('order.titleNumber', { number: order.orderNumber }) : t('order.tracking')}
        showBack
      />
      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !order ? (
        <ErrorState error={q.error} title={t('order.notFound')} onRetry={() => void q.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: theme.screenPadding,
            rowGap: theme.spacing.lg,
            paddingBottom: theme.spacing.huge,
          }}
        >
          {justPlaced === '1' ? (
            <Alert tone="success" title={t('order.placedTitle')} message={t('order.placedBody')} />
          ) : null}
          <OrgStoreOrderDetailsBody order={order} side="CUSTOMER" />
          <View style={{ rowGap: theme.spacing.sm }}>
            {order.canCancel ? (
              <Button
                label={t('order.cancel')}
                variant="outline"
                leftIcon="close-circle-outline"
                fullWidth
                onPress={() => setConfirmCancel(true)}
              />
            ) : null}
            <Button
              label={t('order.openStore')}
              variant="ghost"
              leftIcon="storefront-outline"
              fullWidth
              onPress={() => router.push(storeHref(order.organization.id, order.organization.type))}
            />
          </View>
        </ScrollView>
      )}

      <ConfirmationDialog
        visible={confirmCancel}
        title={t('order.cancelTitle')}
        message={t('order.cancelBody')}
        confirmLabel={t('order.cancelConfirm')}
        cancelLabel={t('order.cancelKeep')}
        destructive
        loading={cancel.isPending}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          if (!orderId) return;
          cancel.mutate(
            { orderId },
            {
              onSuccess: () => {
                setConfirmCancel(false);
                toast.show({ tone: 'success', message: t('order.cancelSuccess') });
              },
              onError: (e) => {
                setConfirmCancel(false);
                toast.show({ tone: 'danger', message: orgStoreErrorMessage(e, t) });
              },
            },
          );
        }}
      />
    </SafeAreaScreen>
  );
}
