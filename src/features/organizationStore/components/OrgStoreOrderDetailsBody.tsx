import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import type { OrgStoreOrder } from '../types';
import { formatOrgStoreMoney } from '../utils';

import { OrgStoreOrderStatusBadge } from './OrgStoreOrderStatusBadge';
import { OrgStoreOrderTimeline } from './OrgStoreOrderTimeline';
import { OrgStorePriceSummary } from './OrgStorePriceSummary';

/** The order sections both the customer and the seller see: header, tracking, items, delivery, totals. */
export function OrgStoreOrderDetailsBody({
  order,
  side,
}: {
  order: OrgStoreOrder;
  side: 'CUSTOMER' | 'SELLER';
}) {
  const theme = useTheme();
  const { t } = useTranslation('organizationStore');

  return (
    <View style={{ rowGap: theme.spacing.lg }}>
      <Card padding="lg">
        <View style={{ rowGap: theme.spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {order.orderNumber}
            </Text>
            <OrgStoreOrderStatusBadge status={order.status} />
          </View>
          {side === 'CUSTOMER' ? (
            <Caption>
              {t('order.store')}: {order.organization.name}
            </Caption>
          ) : order.customer ? (
            <Caption>
              {t('order.customer')}:{' '}
              {`${order.customer.firstName} ${order.customer.lastName}`.trim()}
            </Caption>
          ) : null}
          <Caption>
            {t('order.placedAt')}: {formatDate(order.placedAt)}
          </Caption>
          <Caption>
            {t('order.payment')}: {t('checkout.cod')} ·{' '}
            {t(`order.paymentStatus.${order.paymentStatus}`)}
          </Caption>
        </View>
      </Card>

      <Card padding="lg">
        <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.md }}>
          {t('order.tracking')}
        </Text>
        {order.status === 'CANCELLED' ? (
          <Text color="danger" style={{ marginBottom: theme.spacing.sm }}>
            {t('order.cancelledNotice')}
          </Text>
        ) : null}
        <OrgStoreOrderTimeline order={order} />
      </Card>

      <Card padding="lg">
        <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.md }}>
          {t('order.items')}
        </Text>
        <View style={{ rowGap: theme.spacing.sm }}>
          {order.items.map((it) => (
            <View key={it.id} style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
              <Text style={{ flex: 1 }} numberOfLines={2}>
                {it.name} × {it.quantity}
              </Text>
              <Text variant="bodyMedium">
                {formatOrgStoreMoney(t, it.lineTotal, order.currency)}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Card padding="lg">
        <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.sm }}>
          {t('order.deliveryTo')}
        </Text>
        <Text>{order.recipientName}</Text>
        <Caption>{order.recipientPhone}</Caption>
        <Caption>
          {order.city} — {order.addressLine}
        </Caption>
        {order.note ? (
          <Caption style={{ marginTop: theme.spacing.sm }}>
            {t('order.note')}: {order.note}
          </Caption>
        ) : null}
      </Card>

      <Card padding="lg">
        <OrgStorePriceSummary
          subtotalAmount={order.subtotalAmount}
          deliveryFee={order.deliveryFee}
          totalAmount={order.totalAmount}
          currency={order.currency}
        />
      </Card>
    </View>
  );
}
