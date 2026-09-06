import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { LivestockWeeklySummaryCard } from '../components';
import { useSheepBatches, useSheepWeeklySummary } from '../hooks';

function shiftIsoDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Route `/(app)/livestock/sheep/[organizationId]/sections/weekly`. Mirrors `WeeklyReportScreen`. */
export default function SheepWeeklyReportScreen() {
  const theme = useTheme();
  const { t } = useTranslation('sheepCattleFarm');
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const activeBatches = useSheepBatches(orgId, { status: 'ACTIVE', pageSize: 1 });
  const batch = activeBatches.batches[0];

  const [weekOf, setWeekOf] = useState(() => new Date().toISOString().slice(0, 10));
  const weekly = useSheepWeeklySummary(orgId, batch?.id, weekOf, { enabled: Boolean(batch) });

  return (
    <SafeAreaScreen>
      <AppHeader title={t('weekly.title')} showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: theme.screenPadding, paddingBottom: theme.spacing.huge, rowGap: theme.spacing.lg }}>
        {!batch ? (
          <EmptyState icon="stats-chart-outline" title={t('batch.emptyTitle')} message={t('batch.emptyBody')} />
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <IconButton icon="chevron-back" variant="soft" directional accessibilityLabel={t('weekly.previousWeek')} onPress={() => setWeekOf((w) => shiftIsoDate(w, -7))} />
              <Text variant="bodyMedium">{weekly.data ? `${formatDate(weekly.data.weekStart)} – ${formatDate(weekly.data.weekEnd)}` : t('common.loading')}</Text>
              <IconButton icon="chevron-forward" variant="soft" directional accessibilityLabel={t('weekly.nextWeek')} onPress={() => setWeekOf((w) => shiftIsoDate(w, 7))} />
            </View>

            {weekly.isLoading ? (
              <Loading label={t('common.loading')} />
            ) : weekly.isError ? (
              <ErrorState error={weekly.error} onRetry={() => void weekly.refetch()} />
            ) : weekly.data ? (
              <LivestockWeeklySummaryCard summary={weekly.data} />
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaScreen>
  );
}
