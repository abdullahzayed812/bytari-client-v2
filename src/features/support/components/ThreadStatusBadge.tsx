import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/content';

import { THREAD_STATUS_TONE } from '../constants';
import type { ThreadStatus } from '../types';

export interface ThreadStatusBadgeProps {
  status: ThreadStatus;
  size?: 'sm' | 'md';
}

/** Localised OPEN / CLOSED badge — text + tone, never colour alone (§41). */
export function ThreadStatusBadge({ status, size = 'sm' }: ThreadStatusBadgeProps) {
  const { t } = useTranslation('support');
  return <Badge label={t(`status.${status}`)} tone={THREAD_STATUS_TONE[status]} size={size} />;
}
