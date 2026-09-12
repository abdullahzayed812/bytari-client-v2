import { useTranslation } from 'react-i18next';

import { Badge, type BadgeTone } from '@/components/content';

import type { VetStoreOrderStatus } from '../types';

const TONE: Record<VetStoreOrderStatus, BadgeTone> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'info',
  SHIPPED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

export function OrderStatusBadge({ status }: { status: VetStoreOrderStatus }) {
  const { t } = useTranslation('veterinarianStore');
  return <Badge label={t(`order.status.${status}`)} tone={TONE[status]} size="sm" />;
}
