import { useLocalSearchParams } from 'expo-router';

import { BatchHistoryView } from '@/features/farmShared/components/BatchHistoryView';
import { orgCapabilities, useOrganization } from '@/features/organizations';
import { useCapabilities } from '@/hooks';

import { LivestockBatchSummaryCard } from '../components';
import { useSheepBatchSummary, useSheepDailyRecordWeeks } from '../hooks';

import { SheepWeekRecords } from './SheepFarmDetailsScreen';

const noop = (): void => undefined;

/**
 * Route `/livestock/sheep/[organizationId]/batches/[batchId]/history` — a
 * previous (closed) batch's full history, read-only. Replaces the old
 * "Reopen" action, which turned the closed batch back into the farm's
 * current batch.
 */
export default function SheepBatchHistoryScreen() {
  const { isAdmin } = useCapabilities();
  const { organizationId, batchId } = useLocalSearchParams<{
    organizationId: string;
    batchId: string;
  }>();
  const orgId = organizationId ?? '';
  const detail = useOrganization(orgId);
  const caps = orgCapabilities(detail.data?.myRole, isAdmin, detail.data?.myPermissions);
  const canSeeDaily = caps.canViewFarmDailyRecords;

  const summary = useSheepBatchSummary(orgId, batchId);
  const weeks = useSheepDailyRecordWeeks(orgId, batchId, { enabled: canSeeDaily });

  return (
    <BatchHistoryView
      loading={summary.isLoading || detail.isLoading}
      error={summary.error ?? undefined}
      onRetry={() => void summary.refetch()}
      summary={
        summary.data ? (
          <LivestockBatchSummaryCard
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
      formatWeight={(kg) => `${Number(kg).toLocaleString()} kg`}
      renderWeekRecords={(week) =>
        batchId ? <SheepWeekRecords orgId={orgId} batchId={batchId} week={week} /> : null
      }
    />
  );
}
