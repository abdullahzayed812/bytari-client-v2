import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Chip } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Routes } from '@/constants/routes';
import { IRAQ_GOVERNORATES } from '@/features/vetServices';
import { useCapabilities, useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { JobSeekerCard } from '../components';
import { useMyVetJobSeekerProfile, useVetJobSeekers } from '../hooks';
import type { SeekerBrowseFilter } from '../types';

/** Route `/(app)/vet-jobs/seekers` — "باحثون عن عمل" (reference screenshot 4). */
export default function VetJobSeekersScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetJobs');
  const caps = useCapabilities();

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [governorate, setGovernorate] = useState<string | undefined>();
  const filter: SeekerBrowseFilter = useMemo(
    () => ({ search: search || undefined, governorate }),
    [search, governorate],
  );
  const q = useVetJobSeekers(filter);
  const mine = useMyVetJobSeekerProfile({ enabled: caps.isApprovedVeterinarian });

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('seekers.title')}
        showBack
        right={
          caps.isApprovedVeterinarian ? (
            <IconButton
              icon="add"
              variant="soft"
              accessibilityLabel={t('seekers.addProfile')}
              onPress={() =>
                router.push(mine.data ? Routes.vetJobSeekerProfileEdit : Routes.vetJobSeekerProfileNew)
              }
            />
          ) : undefined
        }
      />
      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.sm }}>
        <SearchInput
          value={rawSearch}
          onChangeText={setRawSearch}
          onClear={() => setRawSearch('')}
          placeholder={t('seekers.searchPlaceholder')}
          accessibilityLabel={t('seekers.searchPlaceholder')}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          columnGap: theme.spacing.sm,
          paddingHorizontal: theme.screenPadding,
          paddingVertical: theme.spacing.sm,
        }}
      >
        <Chip label={t('filters.all')} selected={!governorate} onPress={() => setGovernorate(undefined)} />
        {IRAQ_GOVERNORATES.map((g) => (
          <Chip key={g} label={g} selected={governorate === g} onPress={() => setGovernorate(g)} />
        ))}
      </ScrollView>

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.seekers}
          numColumns={2}
          keyExtractor={(p) => p.id}
          columnWrapperStyle={{ gap: theme.spacing.md }}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <JobSeekerCard profile={item} onPress={() => router.push(Routes.vetJobSeeker(item.id))} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState icon="person-outline" title={t('seekers.empty')} message={t('seekers.emptyHint')} />
          }
          ListFooterComponent={q.isFetchingNextPage ? <Loading label={t('seekers.loadingMore')} /> : null}
          contentContainerStyle={{
            padding: theme.screenPadding,
            paddingBottom: theme.spacing.huge,
            gap: theme.spacing.md,
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
            />
          }
        />
      )}
    </SafeAreaScreen>
  );
}
