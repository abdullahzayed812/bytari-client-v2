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
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { JobOfferCard } from '../components';
import { useJobGridColumns, useVetJobOffers } from '../hooks';
import {
  VET_JOB_EMPLOYMENT_TYPES,
  type OfferBrowseFilter,
  type VetJobEmploymentType,
} from '../types';

/** Route `/(app)/vet-jobs/offers` — "عروض الوظائف" (reference screenshot 2). */
export default function VetJobOffersScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetJobs');

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [employmentType, setEmploymentType] = useState<VetJobEmploymentType | undefined>();
  const filter: OfferBrowseFilter = useMemo(
    () => ({ search: search || undefined, employmentType }),
    [search, employmentType],
  );
  const q = useVetJobOffers(filter);
  // Two compact cards per row (like the Services grid) once each gets ≥ 150px —
  // i.e. on regular phones and up; one full card per row on very narrow screens.
  const grid = useJobGridColumns(150, theme.spacing.md, theme.screenPadding);

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('offers.title')}
        showBack
        right={
          <IconButton
            icon="add"
            variant="soft"
            accessibilityLabel={t('offers.addOffer')}
            onPress={() => router.push(Routes.vetJobOfferNew)}
          />
        }
      />
      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.sm }}>
        <SearchInput
          value={rawSearch}
          onChangeText={setRawSearch}
          onClear={() => setRawSearch('')}
          placeholder={t('offers.searchPlaceholder')}
          accessibilityLabel={t('offers.searchPlaceholder')}
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
        <Chip
          label={t('filters.all')}
          selected={!employmentType}
          onPress={() => setEmploymentType(undefined)}
        />
        {VET_JOB_EMPLOYMENT_TYPES.map((v) => (
          <Chip
            key={v}
            label={t(`employmentType.${v}`)}
            selected={employmentType === v}
            onPress={() => setEmploymentType(v)}
          />
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
          // numColumns cannot change on a mounted FlatList — remount per column count.
          key={`offers-${grid.columns}`}
          onLayout={grid.onLayout}
          data={q.offers}
          keyExtractor={(o) => o.id}
          numColumns={grid.columns}
          columnWrapperStyle={grid.columns === 2 ? { gap: theme.spacing.md } : undefined}
          renderItem={({ item }) => (
            // Equal-height cells only in the 2-up grid (a 1-column `flex: 1`
            // would stretch short lists inside the growing content container).
            <View style={grid.columns === 2 ? { flex: 1 } : undefined}>
              <JobOfferCard
                offer={item}
                variant={grid.columns === 2 ? 'grid' : 'list'}
                onPress={() => router.push(Routes.vetJobOffer(item.id))}
              />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-outline"
              title={t('offers.empty')}
              message={t('offers.emptyHint')}
            />
          }
          ListFooterComponent={
            q.isFetchingNextPage ? <Loading label={t('offers.loadingMore')} /> : null
          }
          contentContainerStyle={{
            padding: theme.screenPadding,
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
            />
          }
        />
      )}
    </SafeAreaScreen>
  );
}
