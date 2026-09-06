import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { LivestockDailyRecordCard, LivestockDailyRecordDialog } from '../components';
import { useCreateSheepDailyRecord, useSheepBatches, useSheepDailyRecords } from '../hooks';

/** Route `/(app)/livestock/sheep/[organizationId]/sections/daily` — البيانات اليومية. Mirrors `DailyRecordsScreen`. */
export default function SheepDailyRecordsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('sheepCattleFarm');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const activeBatches = useSheepBatches(orgId, { status: 'ACTIVE', pageSize: 1 });
  const batch = activeBatches.batches[0];

  const records = useSheepDailyRecords(orgId, batch?.id, { pageSize: 100, enabled: Boolean(batch) });
  const create = useCreateSheepDailyRecord(orgId, batch?.id ?? '');
  const [formOpen, setFormOpen] = useState(false);

  const total = records.data?.meta.total ?? 0;
  const items = records.data?.items ?? [];

  return (
    <SafeAreaScreen>
      <AppHeader title={t('daily.title')} showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: theme.screenPadding, paddingBottom: theme.spacing.huge, rowGap: theme.spacing.md }}>
        {!batch ? (
          <EmptyState icon="clipboard-outline" title={t('batch.emptyTitle')} message={t('batch.emptyBody')} />
        ) : records.isLoading ? (
          <Loading label={t('common.loading')} />
        ) : records.isError ? (
          <ErrorState error={records.error} onRetry={() => void records.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState icon="clipboard-outline" title={t('daily.emptyTitle')} message={t('daily.emptyBody')} />
        ) : (
          items.map((r, i) => <LivestockDailyRecordCard key={r.id} record={r} dayIndex={total - i} />)
        )}
      </ScrollView>

      {batch ? (
        <View style={{ padding: theme.screenPadding }}>
          <Button label={t('batch.addDaily')} variant="primary" fullWidth leftIcon="add" onPress={() => setFormOpen(true)} />
        </View>
      ) : null}

      <LivestockDailyRecordDialog
        visible={formOpen}
        loading={create.isPending}
        onCancel={() => setFormOpen(false)}
        onSubmit={(input) =>
          create.mutate(input, {
            onSuccess: () => {
              toast.show({ tone: 'success', message: t('daily.success') });
              setFormOpen(false);
            },
            onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
          })
        }
      />
    </SafeAreaScreen>
  );
}
