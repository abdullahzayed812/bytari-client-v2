import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/content';

import type { OrganizationType } from '../types';

interface Props {
  type: OrganizationType;
  size?: 'sm' | 'md';
}

/** Localised organization-type pill (CLINIC / FARM / VETERINARY_OFFICE / VETERINARY_STORE). */
export function OrganizationTypeBadge({ type, size = 'sm' }: Props) {
  const { t } = useTranslation('organizations');
  return <Badge label={t(`type.${type}`)} tone="primary" size={size} />;
}
