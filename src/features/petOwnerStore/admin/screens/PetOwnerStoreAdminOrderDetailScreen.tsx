import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Card, Chip, Divider } from '@/components/content';
import { ErrorState, Loading, useToast } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { OrderStatusBadge, PriceSummary } from '../../components';
import { PET_STORE_ORDER_STATUSES, type PetStoreOrderStatus } from '../../types';
import { formatAmount } from '../../utils';
import { usePetStoreAdminOrder, useUpdatePetStoreOrderStatus } from '../hooks';

/** Route `/(app)/admin/pet-owner-store/orders/[orderId]` — order detail + status control. */
export default function PetOwnerStoreAdminOrderDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('petOwnerStore');
  const toast = useToast();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const q = usePetStoreAdminOrder(orderId);
  const updateStatus = useUpdatePetStoreOrderStatus();
  const order = q.data;

  const setStatus = (status: PetStoreOrderStatus): void => {
    if (!order || status === order.status) return;
    updateStatus.mutate(
      { orderId: order.id, status },
      {
        onSuccess: () => toast.show({ message: t('admin.orders.statusUpdated'), tone: 'success' }),
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  return (
    <SafeAreaScreen>
      <AppHeader title={t('order.title')} showBack />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !order ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: theme.screenPadding,
            rowGap: theme.spacing.lg,
            paddingBottom: theme.spacing.huge,
          }}
        >
          <Card variant="outlined" padding="md">
            <View style={{ rowGap: theme.spacing.xs }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text variant="bodyStrong">{order.orderNumber}</Text>
                <OrderStatusBadge status={order.status} />
              </View>
              <Caption>{t(`payment.method.${order.paymentMethod}`)}</Caption>
            </View>
          </Card>

          <View style={{ rowGap: theme.spacing.sm }}>
            <Label>{t('admin.orders.updateStatus')}</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
              {PET_STORE_ORDER_STATUSES.map((s) => (
                <Chip
                  key={s}
                  label={t(`order.status.${s}`)}
                  selected={order.status === s}
                  disabled={updateStatus.isPending}
                  onPress={() => setStatus(s)}
                />
              ))}
            </View>
          </View>

          <Card variant="outlined" padding="md">
            <View style={{ rowGap: theme.spacing.xs }}>
              <Label>{t('admin.orders.customer')}</Label>
              <Text variant="body">{order.recipientName}</Text>
              <Caption>{order.recipientPhone}</Caption>
              <Caption>
                {order.city} — {order.addressLine}
              </Caption>
              {order.note ? <Caption>{order.note}</Caption> : null}
            </View>
          </Card>

          <View style={{ rowGap: theme.spacing.sm }}>
            <Label>{t('order.items')}</Label>
            {order.items.map((it) => (
              <View key={it.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
                  {it.name} × {it.quantity}
                </Text>
                <Text variant="label">
                  {t('common.price', { value: formatAmount(it.lineTotal) })}
                </Text>
              </View>
            ))}
            <Divider />
            <PriceSummary
              subtotalAmount={order.subtotalAmount}
              deliveryFee={order.deliveryFee}
              totalAmount={order.totalAmount}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaScreen>
  );
}
