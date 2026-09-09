import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/content';

import { APPOINTMENT_STATUS_TONE } from '../constants';
import type { AppointmentStatus } from '../types';

export function AppointmentStatusBadge({
  status,
  size = 'md',
}: {
  status: AppointmentStatus;
  size?: 'sm' | 'md';
}) {
  const { t } = useTranslation('clinicAppointments');
  return (
    <Badge
      label={t(`status.${status}`)}
      tone={APPOINTMENT_STATUS_TONE[status] ?? 'neutral'}
      size={size}
    />
  );
}
