import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  Loading,
  useToast,
} from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import {
  DAILY_RECORDS_PER_BATCH,
  DailyRecordWeekStrip,
} from '@/features/farmShared/components/DailyRecordWeekStrip';
import { orgCapabilities, useOrganization } from '@/features/organizations';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { businessToday } from '@/lib/businessDate';
import { useTheme } from '@/theme';

import { LivestockDailyRecordCard, LivestockDailyRecordDialog } from '../components';
import {
  useCreateCattleDailyRecord,
  useDeleteCattleDailyRecord,
  useCattleBatches,
  useCattleDailyRecords,
  useUpdateCattleDailyRecord,
} from '../hooks';
import type { CattleDailyRecord } from '../types';

/**
 * Route `/(app)/livestock/cattle/[organizationId]/sections/daily` — البيانات اليومية
 * as a swipeable Day 1 … Day 7 strip (same rules as poultry: server-assigned
 * date, one record per day, seven per batch — all enforced by the backend).
 */
export default function CattleDailyRecordsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('sheepCattleFarm');
  const { t: tf } = useTranslation('farm');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';
  const { isAdmin } = useCapabilities();
  const org = useOrganization(orgId);
  const canManage = orgCapabilities(org.data?.myRole, isAdmin).canManageFarmPoultry;

  const activeBatches = useCattleBatches(orgId, { status: 'ACTIVE', pageSize: 1 });
  const batch = activeBatches.batches[0];

  const records = useCattleDailyRecords(orgId, batch?.id, { pageSize: 100, enabled: Boolean(batch) });
  const create = useCreateCattleDailyRecord(orgId, batch?.id ?? '');
  const update = useUpdateCattleDailyRecord(orgId, batch?.id ?? '');
  const remove = useDeleteCattleDailyRecord(orgId, batch?.id ?? '');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CattleDailyRecord | null>(null);
  const [deleting, setDeleting] = useState<CattleDailyRecord | null>(null);

  const items = records.data?.items ?? [];
  const todayRecorded = items.some((r) => r.recordDate === businessToday());
  const full = items.length >= DAILY_RECORDS_PER_BATCH;
  const onError = (error: unknown) => toast.show({ tone: 'danger', message: apiErrorMessage(error) });

  return (
    <SafeAreaScreen>
      <AppHeader title={t('daily.title')} showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: theme.screenPadding, paddingBottom: theme.spacing.huge, rowGap: theme.spacing.md }}
      >
        {!batch ? (
          <EmptyState icon="clipboard-outline" title={t('batch.emptyTitle')} message={t('batch.emptyBody')} />
        ) : records.isLoading ? (
          <Loading label={t('common.loading')} />
        ) : records.isError ? (
          <ErrorState error={records.error} onRetry={() => void records.refetch()} />
        ) : (
          <DailyRecordWeekStrip
            records={items}
            todayRecorded={todayRecorded}
            onAddPress={canManage && !full ? () => setFormOpen(true) : undefined}
            renderRecord={(r, day) => (
              <LivestockDailyRecordCard
                record={r}
                dayIndex={day}
                onEdit={canManage ? () => setEditing(r) : undefined}
                onDelete={canManage ? () => setDeleting(r) : undefined}
              />
            )}
          />
        )}
      </ScrollView>

      {batch && canManage ? (
        <View style={{ padding: theme.screenPadding }}>
          <Button
            label={full ? tf('daily.limitReached') : todayRecorded ? tf('daily.alreadyToday') : t('batch.addDaily')}
            variant="primary"
            fullWidth
            leftIcon="add"
            disabled={full || todayRecorded}
            onPress={() => setFormOpen(true)}
          />
        </View>
      ) : null}

      <LivestockDailyRecordDialog
        visible={formOpen || editing != null}
        initial={editing}
        title={editing ? tf('daily.editTitle', { day: editing.dayNumber ?? '' }) : undefined}
        loading={create.isPending || update.isPending}
        onCancel={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={(input) => {
          if (editing) {
            update.mutate(
              { recordId: editing.id, body: input },
              {
                onSuccess: () => {
                  toast.show({ tone: 'success', message: tf('daily.updated') });
                  setEditing(null);
                },
                onError,
              },
            );
            return;
          }
          create.mutate(input, {
            onSuccess: () => {
              toast.show({ tone: 'success', message: t('daily.success') });
              setFormOpen(false);
            },
            onError,
          });
        }}
      />

      <ConfirmationDialog
        visible={deleting != null}
        title={tf('daily.deleteTitle')}
        message={tf('daily.deleteBody')}
        confirmLabel={tf('daily.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => {
              toast.show({ tone: 'success', message: tf('daily.deleted') });
              setDeleting(null);
            },
            onError: (e) => {
              setDeleting(null);
              onError(e);
            },
          });
        }}
      />
    </SafeAreaScreen>
  );
}
