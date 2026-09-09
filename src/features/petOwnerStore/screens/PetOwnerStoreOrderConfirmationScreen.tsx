import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Card, Divider, Icon } from '@/components/content';
import { ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { OrderStatusBadge, PriceSummary, StoreHeader } from '../components';
import { usePetOwnerStoreOrder } from '../hooks';
import { formatAmount } from '../utils';

/**
 * Route `/pet-owner-store/orders/[orderId]` — one order. With `?justPlaced=1`
 * (set right after checkout) it opens as the order-confirmation screen.
 */
export default function PetOwnerStoreOrderConfirmationScreen() {
  const theme = useTheme();
  const { t } = useTranslation('petOwnerStore');
  const { orderId, justPlaced } = useLocalSearchParams<{ orderId: string; justPlaced?: string }>();
  const isConfirmation = justPlaced === '1';

  const q = usePetOwnerStoreOrder(orderId);
  const order = q.data;

  return (
    <SafeAreaScreen>
      <StoreHeader title={isConfirmation ? t('confirmation.title') : t('order.title')} showBack />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !order ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{
              padding: theme.screenPadding,
              rowGap: theme.spacing.lg,
              paddingBottom: theme.spacing.huge,
            }}
          >
            {isConfirmation ? (
              <View style={{ alignItems: 'center', rowGap: theme.spacing.sm }}>
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: theme.colors.successSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="checkmark-circle" size="iconXl" color="success" />
                </View>
                <Heading level={2} center>
                  {t('confirmation.heading')}
                </Heading>
                <Caption center>{t('confirmation.subtitle')}</Caption>
              </View>
            ) : null}

            <Card variant="outlined" padding="md">
              <View style={{ rowGap: theme.spacing.sm }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Label>{t('order.number')}</Label>
                  <Text variant="bodyStrong">{order.orderNumber}</Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Caption>{t('order.placedAt')}</Caption>
                  <OrderStatusBadge status={order.status} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Caption>{t('payment.title')}</Caption>
                  <Text variant="label">{t(`payment.method.${order.paymentMethod}`)}</Text>
                </View>
              </View>
            </Card>

            <Card variant="outlined" padding="md">
              <View style={{ rowGap: theme.spacing.xs }}>
                <Label>{t('checkout.deliveryInfo')}</Label>
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

          {isConfirmation ? (
            <View
              style={{
                padding: theme.screenPadding,
                rowGap: theme.spacing.sm,
                borderTopWidth: theme.sizes.hairline,
                borderTopColor: theme.colors.border,
              }}
            >
              <Button
                label={t('confirmation.keepShopping')}
                fullWidth
                onPress={() => router.replace(Routes.petOwnerStore)}
              />
              <TextButton
                label={t('confirmation.viewOrders')}
                onPress={() => router.replace(Routes.petOwnerStoreOrders)}
              />
            </View>
          ) : null}
        </>
      )}
    </SafeAreaScreen>
  );
}
