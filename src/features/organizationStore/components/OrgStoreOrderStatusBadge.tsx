import { useTranslation } from 'react-i18next';

import { Badge, type BadgeTone } from '@/components/content';

import type { OrgStoreOrderStatus } from '../types';

const TONE: Record<OrgStoreOrderStatus, BadgeTone> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'info',
  SHIPPED: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

export function OrgStoreOrderStatusBadge({ status }: { status: OrgStoreOrderStatus }) {
  const { t } = useTranslation('organizationStore');
  return <Badge label={t(`order.status.${status}`)} tone={TONE[status]} size="sm" />;
}
