import { useTranslation } from 'react-i18next';

import { TextButton } from '@/components/actions';
import type { ReportTargetType } from '@/features/globalChat/types';

import { openReport } from './openReport';

/** A small "إبلاغ" flag action — reports `targetId` via the shared report screen. */
export function ReportLink({
  targetType,
  targetId,
  label,
}: {
  targetType: ReportTargetType;
  targetId: string;
  label?: string;
}) {
  const { t } = useTranslation('globalChat');
  return (
    <TextButton
      label={label ?? t('safety.report')}
      icon="flag-outline"
      tone="danger"
      onPress={() => openReport(targetType, targetId)}
    />
  );
}
