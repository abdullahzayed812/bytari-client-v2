import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge, Card } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import type { OrgStoreOrder } from '../types';
import { formatOrgStoreMoney } from '../utils';

import { OrgStoreOrderStatusBadge } from './OrgStoreOrderStatusBadge';

interface Props {
  order: OrgStoreOrder;
  /** CUSTOMER shows the store's name, SELLER the customer + "new" badge. */
  side: 'CUSTOMER' | 'SELLER';
  onPress: () => void;
}

export function OrgStoreOrderCard({ order, side, onPress }: Props) {
  const theme = useTheme();
  const { t } = useTranslation('organizationStore');
  const counterpart =
    side === 'CUSTOMER'
      ? order.organization.name
      : order.customer
        ? `${order.customer.firstName} ${order.customer.lastName}`.trim()
        : order.recipientName;

  return (
    <Card variant="outlined" padding="md" onPress={onPress} accessibilityLabel={order.orderNumber}>
      <View style={{ rowGap: theme.spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
          <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
            {order.orderNumber}
          </Text>
          {side === 'SELLER' && order.isNew ? (
            <Badge label={t('incoming.newBadge')} tone="danger" size="sm" />
          ) : null}
          <OrgStoreOrderStatusBadge status={order.status} />
        </View>
        <Text color="textSecondary" numberOfLines={1}>
          {counterpart}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Caption>
            {t('orders.itemCount', { count: order.itemCount })} · {formatDate(order.placedAt)}
          </Caption>
          <Text variant="label" color="primary">
            {formatOrgStoreMoney(t, order.totalAmount, order.currency)}
          </Text>
        </View>
      </View>
    </Card>
  );
}
