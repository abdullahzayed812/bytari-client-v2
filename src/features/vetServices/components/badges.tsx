import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/content';

import {
  ENGAGEMENT_STATUS_TONE,
  MODERATION_STATUS_TONE,
  URGENCY_TONE,
} from '../constants';
import type { EngagementStatus, ModerationStatus, VetServiceUrgency } from '../types';

export function ModerationStatusBadge({
  status,
  size = 'sm',
}: {
  status: ModerationStatus;
  size?: 'sm' | 'md';
}) {
  const { t } = useTranslation('vetServices');
  return <Badge label={t(`moderationStatus.${status}`)} tone={MODERATION_STATUS_TONE[status]} size={size} />;
}

export function EngagementStatusBadge({
  status,
  size = 'sm',
}: {
  status: EngagementStatus;
  size?: 'sm' | 'md';
}) {
  const { t } = useTranslation('vetServices');
  return <Badge label={t(`engagementStatus.${status}`)} tone={ENGAGEMENT_STATUS_TONE[status]} size={size} />;
}

export function UrgencyBadge({ urgency }: { urgency: VetServiceUrgency }) {
  const { t } = useTranslation('vetServices');
  if (urgency === 'NORMAL') return null;
  return <Badge label={t('urgency.URGENT')} tone={URGENCY_TONE.URGENT} size="sm" />;
}
