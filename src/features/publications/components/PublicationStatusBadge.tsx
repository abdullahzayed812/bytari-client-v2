import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/content';

import { PUBLICATION_STATUS_TONE } from '../constants';
import type { PublicationStatus } from '../types';

interface Props {
  status: PublicationStatus;
  size?: 'sm' | 'md';
}

/** Localised approval-status pill — OWNER view only (the public DTO has no status). */
export function PublicationStatusBadge({ status, size = 'sm' }: Props) {
  const { t } = useTranslation('publications');
  return <Badge label={t(`status.${status}`)} tone={PUBLICATION_STATUS_TONE[status]} size={size} />;
}
