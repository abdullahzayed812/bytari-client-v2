import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useCapabilities, useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { ServiceFiltersBar, ServiceListingCard } from '../components';
import { IRAQ_GOVERNORATES } from '../constants';
import { useServiceListings } from '../hooks';
import { VET_SERVICE_ANIMAL_TYPES, VET_SERVICE_TYPES, type ListingBrowseFilter } from '../types';

/** Route `/(app)/vet-services/listings` — "خدمات الأطباء" (reference screenshot 2A). */
export default function ServiceListingsBrowseScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetServices');
  const caps = useCapabilities();

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [f, setF] = useState<Record<string, string | undefined>>({});

  const filter: ListingBrowseFilter = useMemo(
    () => ({
      search: search || undefined,
      serviceType: f.serviceType as ListingBrowseFilter['serviceType'],
      animalType: f.animalType as ListingBrowseFilter['animalType'],
      governorate: f.governorate,
    }),
    [search, f],
  );
  const q = useServiceListings(filter);

  const filters = [
    {
      key: 'serviceType',
      label: t('filters.serviceType'),
      options: VET_SERVICE_TYPES.map((v) => ({ value: v, label: t(`serviceType.${v}`) })),
    },
    {
      key: 'animalType',
      label: t('filters.animalType'),
      options: VET_SERVICE_ANIMAL_TYPES.map((v) => ({ value: v, label: t(`animalType.${v}`) })),
    },
    {
      key: 'governorate',
      label: t('filters.governorate'),
      options: IRAQ_GOVERNORATES.map((v) => ({ value: v, label: v })),
    },
  ];

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('listings.title')}
        showBack
        right={
          caps.isApprovedVeterinarian ? (
            <IconButton
              icon="add"
              variant="soft"
              accessibilityLabel={t('listings.addCta')}
              onPress={() => router.push(Routes.vetServiceListingNew)}
            />
          ) : undefined
        }
      />
      <Caption color="textSecondary" style={{ paddingHorizontal: theme.screenPadding }}>
        {t('listings.subtitle')}
      </Caption>
      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.sm }}>
        <SearchInput
          value={rawSearch}
          onChangeText={setRawSearch}
          onClear={() => setRawSearch('')}
          placeholder={t('listings.searchPlaceholder')}
          accessibilityLabel={t('listings.searchPlaceholder')}
        />
      </View>
      <ServiceFiltersBar
        filters={filters}
        values={f}
        onChange={(k, v) => setF((cur) => ({ ...cur, [k]: v }))}
      />

      {q.isLoading ? (
        <Loading fill label={t('common.loading')} />
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.listings}
          numColumns={2}
          keyExtractor={(l) => l.id}
          columnWrapperStyle={{ gap: theme.spacing.md }}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <ServiceListingCard
                listing={item}
                onPress={() => router.push(Routes.vetServiceListing(item.id))}
                onPrimary={() => router.push(Routes.vetServiceListing(item.id))}
              />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState icon="medkit-outline" title={t('listings.empty')} message={t('listings.emptyHint')} />
          }
          ListFooterComponent={q.isFetchingNextPage ? <Loading label={t('common.loadingMore')} /> : null}
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
