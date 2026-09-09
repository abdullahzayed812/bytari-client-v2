import { useTranslation } from 'react-i18next';

import { Badge, type BadgeTone } from '@/components/content';

import type { PetStoreOrderStatus } from '../types';

const TONE: Record<PetStoreOrderStatus, BadgeTone> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'info',
  SHIPPED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

export function OrderStatusBadge({ status }: { status: PetStoreOrderStatus }) {
  const { t } = useTranslation('petOwnerStore');
  return <Badge label={t(`order.status.${status}`)} tone={TONE[status]} size="sm" />;
}
