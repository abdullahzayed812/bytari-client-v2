import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/content';

import type { SyndicateAnnouncementType, SyndicateSubmissionStatus } from '../types';

const TYPE_TONE = { ANNOUNCEMENT: 'success', IMPORTANT_NOTICE: 'danger' } as const;
const STATUS_TONE = { PENDING: 'warning', RESPONDED: 'info', CLOSED: 'neutral' } as const;

export function SyndicateAnnouncementTypeBadge({
  type,
  size = 'sm',
}: {
  type: SyndicateAnnouncementType;
  size?: 'sm' | 'md';
}) {
  const { t } = useTranslation('syndicates');
  return <Badge label={t(`type.${type}`)} tone={TYPE_TONE[type]} size={size} />;
}

export function SyndicateSubmissionStatusBadge({
  status,
  size = 'sm',
}: {
  status: SyndicateSubmissionStatus;
  size?: 'sm' | 'md';
}) {
  const { t } = useTranslation('syndicates');
  return <Badge label={t(`submissionStatus.${status}`)} tone={STATUS_TONE[status]} size={size} />;
}
