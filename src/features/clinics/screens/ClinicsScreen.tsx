import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Routes } from '@/constants/routes';
import {
  ClinicCard,
  DiscoverFilterBar,
  useDiscoverOrganizations,
  type DiscoverFilters,
  type DiscoverSort,
  type PublicOrganization,
} from '@/features/organizations';
import { useDebouncedValue, type Coordinates } from '@/hooks';
import { useTheme } from '@/theme';

/**
 * "Available clinics" — every ACTIVE clinic, open to any signed-in pet owner
 * (not membership-scoped). Backs the Home section's "View all" link.
 */
export default function ClinicsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizations');

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [sort, setSort] = useState<DiscoverSort>('default');
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [filters, setFilters] = useState<DiscoverFilters>({});

  const q = useDiscoverOrganizations({
    type: 'CLINIC',
    search: search || undefined,
    sort,
    near: sort === 'nearest' ? (coords ?? undefined) : undefined,
    filters,
  });

  const goToDetail = (org: PublicOrganization) =>
    router.push(Routes.organizationDiscoverDetail(org.id));

  const handleSortChange = (nextSort: DiscoverSort, fix?: Coordinates) => {
    if (fix) setCoords(fix);
    setSort(nextSort);
  };

  const emptyTitle =
    sort === 'nearest'
      ? t('discover.emptyNearest')
      : search
        ? t('discover.emptySearch')
        : t('discover.empty');

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('discover.title')}
        subtitle={t('discover.subtitle')}
        showBack
        backAlign="left"
      />

      <DiscoverFilterBar
        search={rawSearch}
        onSearchChange={setRawSearch}
        searchPlaceholder={t('discover.searchPlaceholder')}
        sort={sort}
        onSortChange={handleSortChange}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {q.isLoading ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <Loading fill />
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.organizations}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => (
            <ClinicCard organization={item} width="100%" onPress={() => goToDetail(item)} />
          )}
          ListEmptyComponent={<EmptyState icon="medkit-outline" title={emptyTitle} />}
          ListFooterComponent={
            q.isFetchingNextPage ? <Loading label={t('discover.loadingMore')} /> : null
          }
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.lg,
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
