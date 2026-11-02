import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { BatchHistoryView } from '@/features/farmShared/components/BatchHistoryView';
import { orgCapabilities, useOrganization } from '@/features/organizations';
import { useCapabilities } from '@/hooks';

import { BatchSummaryCard } from '../components';
import { useBatchSummary, useDailyRecordWeeks } from '../hooks';

import { PoultryWeekRecords } from './PoultryFarmDetailsScreen';

const noop = (): void => undefined;

/**
 * Route `/organizations/[organizationId]/poultry/[flockId]/history` — a
 * previous (closed) batch's full history, read-only. Replaces the old
 * "Reopen" action, which turned the closed batch back into the farm's
 * current batch.
 */
export default function PoultryBatchHistoryScreen() {
  const { t } = useTranslation('poultry');
  const { isAdmin } = useCapabilities();
  const { organizationId, flockId } = useLocalSearchParams<{
    organizationId: string;
    flockId: string;
  }>();
  const orgId = organizationId ?? '';
  const detail = useOrganization(orgId);
  const caps = orgCapabilities(detail.data?.myRole, isAdmin, detail.data?.myPermissions);
  const canSeeDaily = caps.canViewFarmDailyRecords;

  const summary = useBatchSummary(orgId, flockId);
  const weeks = useDailyRecordWeeks(orgId, flockId, { enabled: canSeeDaily });

  return (
    <BatchHistoryView
      loading={summary.isLoading || detail.isLoading}
      error={summary.error ?? undefined}
      onRetry={() => void summary.refetch()}
      summary={
        summary.data ? (
          <BatchSummaryCard
            summary={summary.data}
            canManage={false}
            canSell={false}
            onAddDaily={noop}
            onWeeklyReport={noop}
            onSell={noop}
          />
        ) : null
      }
      canSeeDaily={canSeeDaily}
      weeks={weeks.data}
      weeksLoading={weeks.isLoading}
      formatWeight={(g) => `${Number(g).toLocaleString()} ${t('weekly.weightUnit')}`}
      renderWeekRecords={(week) =>
        flockId ? <PoultryWeekRecords orgId={orgId} flockId={flockId} week={week} /> : null
      }
    />
  );
}
