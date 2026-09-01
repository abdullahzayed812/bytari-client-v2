import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { Chip } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { MedicalTimelineItem, RecordCardSkeleton } from '../components';
import { useMedicalTimeline } from '../hooks';
import type { MedicalTimelineEntry, MedicalTimelineType } from '../types';

import { useMedicalRouteScope } from './useMedicalRouteScope';

/**
 * The animal's medical history — one chronological list of records + vaccinations
 * (backend-composed & ordered, §13/§23). Scope-aware: CLINIC context via
 * `/organizations/[organizationId]/animals/[animalId]/medical-history`, OWNER
 * context via `/pets/[petId]/medical-history`. Read-only; tapping an entry opens
 * the matching record / vaccination detail.
 */
export default function MedicalTimelineScreen() {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const { animalId, organizationId, isClinic } = useMedicalRouteScope();
  const [filter, setFilter] = useState<MedicalTimelineType | undefined>(undefined);

  const q = useMedicalTimeline({ animalId, organizationId }, { type: filter });

  const open = (entry: MedicalTimelineEntry) => {
    if (entry.type === 'MEDICAL_RECORD' && entry.medicalRecord) {
      router.push(
        isClinic
          ? Routes.orgAnimalMedicalRecord(
              organizationId as string,
              animalId,
              entry.medicalRecord.id,
            )
          : Routes.petMedicalRecord(animalId, entry.medicalRecord.id),
      );
    } else if (entry.type === 'VACCINATION' && entry.vaccination) {
      router.push(
        isClinic
          ? Routes.orgAnimalVaccination(organizationId as string, animalId, entry.vaccination.id)
          : Routes.petVaccination(animalId, entry.vaccination.id),
      );
    }
  };

  const header = (
    <View style={{ paddingBottom: theme.spacing.md, rowGap: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
        <Chip
          label={t('timeline.filterAll')}
          selected={filter === undefined}
          onPress={() => setFilter(undefined)}
        />
        <Chip
          label={t('timeline.type.MEDICAL_RECORD')}
          selected={filter === 'MEDICAL_RECORD'}
          onPress={() => setFilter((f) => (f === 'MEDICAL_RECORD' ? undefined : 'MEDICAL_RECORD'))}
        />
        <Chip
          label={t('timeline.type.VACCINATION')}
          selected={filter === 'VACCINATION'}
          onPress={() => setFilter((f) => (f === 'VACCINATION' ? undefined : 'VACCINATION'))}
        />
      </View>
      {q.total > 0 ? <Caption>{t('timeline.count', { count: q.total })}</Caption> : null}
    </View>
  );

  return (
    <SafeAreaScreen>
      <AppHeader title={t('timeline.title')} showBack />

      {q.isLoading ? (
        <View
          style={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
            rowGap: theme.spacing.md,
          }}
        >
          {header}
          {[0, 1, 2, 3].map((i) => (
            <RecordCardSkeleton key={i} />
          ))}
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          {header}
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.entries}
          keyExtractor={(e) =>
            `${e.type}:${e.medicalRecord?.id ?? e.vaccination?.id ?? e.createdAt}`
          }
          renderItem={({ item }) => (
            <MedicalTimelineItem
              entry={item}
              organizationId={organizationId}
              onPress={() => open(item)}
            />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon="time-outline"
              title={filter ? t('timeline.emptyFiltered') : t('timeline.empty')}
            />
          }
          ListFooterComponent={
            q.isFetchingNextPage ? <Loading label={t('common.loadingMore')} /> : null
          }
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.md,
            flexGrow: 1,
          }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching && !q.isFetchingNextPage}
              onRefresh={() => void q.refetch()}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </SafeAreaScreen>
  );
}
