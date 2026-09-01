import { useTranslation } from 'react-i18next';

import { Badge, type BadgeTone } from '@/components/content';

import type { VeterinarianStatus } from '../types';

const TONE: Record<VeterinarianStatus, BadgeTone> = {
  NOT_APPLIED: 'neutral',
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

interface Props {
  status: VeterinarianStatus;
  /** Hide entirely when the user has never applied. Default `false`. */
  hideWhenNotApplied?: boolean;
  size?: 'sm' | 'md';
}

/** Localised veterinarian-approval status pill (§13). */
export function VeterinarianStatusBadge({ status, hideWhenNotApplied, size = 'sm' }: Props) {
  const { t } = useTranslation('auth');
  if (hideWhenNotApplied && status === 'NOT_APPLIED') return null;
  return <Badge label={t(`vetStatus.${status}`)} tone={TONE[status]} size={size} />;
}
