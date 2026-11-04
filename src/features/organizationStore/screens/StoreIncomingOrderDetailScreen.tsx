import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card } from '@/components/content';
import { Alert, ConfirmationDialog, ErrorState, Loading, useToast } from '@/components/feedback';
import { Input } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Text } from '@/components/typography';
import { orgCapabilities, useOrganization } from '@/features/organizations';
import { useCapabilities } from '@/hooks';
import { useTheme } from '@/theme';
import { openPhone } from '@/utils';

import { OrgStoreOrderDetailsBody } from '../components';
import {
  useIncomingOrgStoreOrder,
  useOrderConversation,
  useOrgStoreRealtime,
  useUpdateIncomingOrgStoreOrderStatus,
} from '../hooks';
import { ORG_STORE_ORDER_TRANSITIONS, type OrgStoreOrderStatus } from '../types';
import { orgStoreErrorMessage } from '../utils';

/**
 * Route `/organization-store/[organizationId]/incoming-orders/[orderId]` — one
 * incoming order. Status actions follow the server's transition map and show
 * only with `store.order.manage`; opening it clears the "new" badge.
 */
export default function StoreIncomingOrderDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizationStore');
  const toast = useToast();
  const { isAdmin } = useCapabilities();
  const { organizationId, orderId } = useLocalSearchParams<{
    organizationId: string;
    orderId: string;
  }>();
  const orgId = organizationId ?? '';
  useOrgStoreRealtime();

  const org = useOrganization(orgId);
  const caps = orgCapabilities(org.data?.myRole, isAdmin, org.data?.myPermissions);
  const q = useIncomingOrgStoreOrder(orgId, orderId);
  const update = useUpdateIncomingOrgStoreOrderStatus(orgId);
  const [note, setNote] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const message = useOrderConversation({
    side: 'SELLER',
    organizationId: orgId,
    orderId: orderId ?? '',
  });

  const order = q.data;
  const next = order ? ORG_STORE_ORDER_TRANSITIONS[order.status] : [];
  const forward = next.filter((s) => s !== 'CANCELLED');
  const canCancel = next.includes('CANCELLED');
  const expired = org.data?.details.subscriptionStatus === 'EXPIRED';

  const apply = (status: OrgStoreOrderStatus) => {
    if (!orderId || update.isPending) return;
    update.mutate(
      { orderId, status, note: note.trim() || null },
      {
        onSuccess: () => {
          setNote('');
          setConfirmCancel(false);
          toast.show({ tone: 'success', message: t('incoming.statusUpdated') });
        },
        onError: (e) => {
          setConfirmCancel(false);
          toast.show({ tone: 'danger', message: orgStoreErrorMessage(e, t) });
        },
      },
    );
  };

  return (
    <SafeAreaScreen>
      <AppHeader
        title={order ? t('order.titleNumber', { number: order.orderNumber }) : t('incoming.title')}
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
          keyboardShouldPersistTaps="handled"
        >
          <Button
            label={t('order.callCustomer')}
            variant="outline"
            leftIcon="call"
            fullWidth
            onPress={() => void openPhone(order.recipientPhone)}
          />
          <Button
            label={t('order.messageCustomer')}
            leftIcon="chatbubble-ellipses-outline"
            fullWidth
            loading={message.isPending}
            disabled={message.isPending || expired}
            onPress={message.open}
          />

          <Card padding="lg">
            <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.md }}>
              {t('incoming.actionsTitle')}
            </Text>
            {expired ? (
              <Alert tone="warning" message={t('incoming.locked')} />
            ) : next.length === 0 ? (
              <Alert tone="info" message={t('incoming.terminal')} />
            ) : !caps.canManageStoreOrders ? (
              <Alert tone="info" message={t('incoming.readOnly')} />
            ) : (
              <View style={{ rowGap: theme.spacing.sm }}>
                <Input
                  value={note}
                  onChangeText={setNote}
                  placeholder={t('incoming.notePlaceholder')}
                  maxLength={500}
                  accessibilityLabel={t('incoming.notePlaceholder')}
                />
                {forward.map((s) => (
                  <Button
                    key={s}
                    label={t(`incoming.actionTo.${s}` as 'incoming.actionTo.CONFIRMED')}
                    fullWidth
                    loading={update.isPending && update.variables?.status === s}
                    disabled={update.isPending}
                    onPress={() => apply(s)}
                  />
                ))}
                {canCancel ? (
                  <Button
                    label={t('incoming.actionTo.CANCELLED')}
                    variant="outline"
                    fullWidth
                    disabled={update.isPending}
                    onPress={() => setConfirmCancel(true)}
                  />
                ) : null}
              </View>
            )}
          </Card>

          <OrgStoreOrderDetailsBody order={order} side="SELLER" />
        </ScrollView>
      )}

      <ConfirmationDialog
        visible={confirmCancel}
        title={t('order.cancelTitle')}
        message={note.trim() || t('incoming.notePlaceholder')}
        confirmLabel={t('incoming.actionTo.CANCELLED')}
        cancelLabel={t('order.cancelKeep')}
        destructive
        loading={update.isPending}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => apply('CANCELLED')}
      />
    </SafeAreaScreen>
  );
}
