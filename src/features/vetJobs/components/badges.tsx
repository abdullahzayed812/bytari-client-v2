import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/content';

import type { VetJobApplicationStatus, VetJobModerationStatus } from '../types';

const MODERATION_TONE = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' } as const;
const APPLICATION_TONE = { PENDING: 'warning', ACCEPTED: 'success', REJECTED: 'danger' } as const;

export function VetJobStatusBadge({
  status,
  size = 'sm',
}: {
  status: VetJobModerationStatus;
  size?: 'sm' | 'md';
}) {
  const { t } = useTranslation('vetJobs');
  return <Badge label={t(`status.${status}`)} tone={MODERATION_TONE[status]} size={size} />;
}

export function VetJobApplicationStatusBadge({
  status,
  size = 'sm',
}: {
  status: VetJobApplicationStatus;
  size?: 'sm' | 'md';
}) {
  const { t } = useTranslation('vetJobs');
  return <Badge label={t(`applicationStatus.${status}`)} tone={APPLICATION_TONE[status]} size={size} />;
}
