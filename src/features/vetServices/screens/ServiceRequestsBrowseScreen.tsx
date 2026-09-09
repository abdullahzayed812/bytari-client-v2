import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Chip } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useAuth, useCapabilities, useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { ServiceFiltersBar, ServiceRequestCard } from '../components';
import { IRAQ_GOVERNORATES } from '../constants';
import { useMyServiceRequests, useServiceRequests } from '../hooks';
import {
  VET_SERVICE_ANIMAL_TYPES,
  VET_SERVICE_TYPES,
  VET_SERVICE_URGENCIES,
  type MineScope,
  type RequestBrowseFilter,
} from '../types';

/** Route `/(app)/vet-services/requests` — "طلبات أصحاب الحيوانات" (screenshot 3A). */
export default function ServiceRequestsBrowseScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetServices');
  const { user } = useAuth();
  const caps = useCapabilities();

  const [scope, setScope] = useState<MineScope>('all');
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [f, setF] = useState<Record<string, string | undefined>>({});

  const filter: RequestBrowseFilter = useMemo(
    () => ({
      search: search || undefined,
      serviceType: f.serviceType as RequestBrowseFilter['serviceType'],
      animalType: f.animalType as RequestBrowseFilter['animalType'],
      governorate: f.governorate,
      urgency: f.urgency as RequestBrowseFilter['urgency'],
    }),
    [search, f],
  );

  const allQ = useServiceRequests(filter, { enabled: scope === 'all' });
  const mineQ = useMyServiceRequests(undefined, { enabled: scope === 'mine' });
  const q = scope === 'all' ? allQ : mineQ;

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
    {
      key: 'urgency',
      label: t('filters.urgency'),
      options: VET_SERVICE_URGENCIES.map((v) => ({ value: v, label: t(`urgency.${v}`) })),
    },
  ];

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('requests.title')}
        showBack
        right={
          <IconButton
            icon="add"
            variant="soft"
            accessibilityLabel={t('requests.addCta')}
            onPress={() => router.push(Routes.vetServiceRequestNew)}
          />
        }
      />
      <Caption color="textSecondary" style={{ paddingHorizontal: theme.screenPadding }}>
        {t('requests.subtitle')}
      </Caption>

      <View
        style={{
          flexDirection: 'row',
          columnGap: theme.spacing.sm,
          paddingHorizontal: theme.screenPadding,
          paddingTop: theme.spacing.sm,
        }}
      >
        <Chip label={t('scope.all')} selected={scope === 'all'} onPress={() => setScope('all')} />
        <Chip label={t('scope.mine')} selected={scope === 'mine'} onPress={() => setScope('mine')} />
      </View>

      {scope === 'all' ? (
        <>
          <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.sm }}>
            <SearchInput
              value={rawSearch}
              onChangeText={setRawSearch}
              onClear={() => setRawSearch('')}
              placeholder={t('requests.searchPlaceholder')}
              accessibilityLabel={t('requests.searchPlaceholder')}
            />
          </View>
          <ServiceFiltersBar
            filters={filters}
            values={f}
            onChange={(k, v) => setF((cur) => ({ ...cur, [k]: v }))}
          />
        </>
      ) : null}

      {q.isLoading ? (
        <Loading fill label={t('common.loading')} />
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.requests}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => {
            const canOffer =
              scope === 'all' &&
              caps.isApprovedVeterinarian &&
              item.petOwnerUserId !== user?.id &&
              item.status === 'APPROVED';
            return (
              <ServiceRequestCard
                request={item}
                showStatus={scope === 'mine'}
                onPress={() => router.push(Routes.vetServiceRequest(item.id))}
                onPrimary={canOffer ? () => router.push(Routes.vetServiceOfferNew(item.id)) : undefined}
                primaryLabel={t('actions.submitOffer')}
              />
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="clipboard-outline"
              title={scope === 'mine' ? t('requests.mineEmpty') : t('requests.empty')}
              message={scope === 'mine' ? t('requests.mineEmptyHint') : t('requests.emptyHint')}
            />
          }
          ListFooterComponent={q.isFetchingNextPage ? <Loading label={t('common.loadingMore')} /> : null}
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
