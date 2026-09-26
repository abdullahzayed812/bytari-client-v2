import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { Button } from '@/components/actions';
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

const PAGE_SIZE = 6;

/**
 * "المكاتب البيطرية" — every ACTIVE VETERINARY_OFFICE organization, open to
 * any signed-in user (not membership-scoped). Reuses the exact same discover
 * infrastructure as the Pet Owner Home "Available clinics" screen — only the
 * organization `type` filter and copy differ.
 */
export default function VeterinaryOfficesScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOffices');
  const { t: torg } = useTranslation('organizations');

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [sort, setSort] = useState<DiscoverSort>('default');
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [filters, setFilters] = useState<DiscoverFilters>({});

  const q = useDiscoverOrganizations({
    type: 'VETERINARY_OFFICE',
    search: search || undefined,
    sort,
    near: sort === 'nearest' ? (coords ?? undefined) : undefined,
    pageSize: PAGE_SIZE,
  });

  const goToDetail = (org: PublicOrganization) =>
    router.push(Routes.veterinaryOfficeDetail(org.id));

  const handleSortChange = (nextSort: DiscoverSort, fix?: Coordinates) => {
    if (fix) setCoords(fix);
    setSort(nextSort);
  };

  const emptyTitle =
    sort === 'nearest'
      ? torg('discover.emptyNearest')
      : search
        ? torg('discover.emptySearch')
        : t('list.empty');

  return (
    <SafeAreaScreen>
      <AppHeader title={t('list.title')} subtitle={t('list.subtitle')} showBack backAlign="left" />

      <DiscoverFilterBar
        search={rawSearch}
        onSearchChange={setRawSearch}
        searchPlaceholder={t('list.searchPlaceholder')}
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
          ListEmptyComponent={<EmptyState icon="business-outline" title={emptyTitle} />}
          ListFooterComponent={
            q.isFetchingNextPage ? (
              <Loading label={torg('discover.loadingMore')} />
            ) : q.hasNextPage ? (
              <Button
                label={t('list.loadMore')}
                variant="outline"
                fullWidth
                onPress={() => void q.fetchNextPage()}
              />
            ) : null
          }
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.md,
            flexGrow: 1,
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
