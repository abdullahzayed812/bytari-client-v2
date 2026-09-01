import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/content';

import { ORG_STATUS_TONE } from '../constants';
import type { OrganizationStatus } from '../types';

interface Props {
  status: OrganizationStatus;
  size?: 'sm' | 'md';
}

/** Localised organization lifecycle-status pill (PENDING / ACTIVE / REJECTED / …). */
export function OrganizationStatusBadge({ status, size = 'sm' }: Props) {
  const { t } = useTranslation('organizations');
  return <Badge label={t(`status.${status}`)} tone={ORG_STATUS_TONE[status]} size={size} />;
}
