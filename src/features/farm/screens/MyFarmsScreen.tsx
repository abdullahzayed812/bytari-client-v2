import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Routes } from '@/constants/routes';
import type { FarmSpecies, MyOrganization } from '@/features/organizations/types';
import { CattleFarmCard } from '@/features/livestockFarm/components/CattleFarmCard';
import { SheepFarmCard } from '@/features/livestockFarm/components/SheepFarmCard';
import { useTheme } from '@/theme';

import { PoultryCardSkeleton, PoultryFarmCard } from '../components';
import { useMyFarms } from '../hooks';

type SpeciesGroup = 'POULTRY' | 'SHEEP_CATTLE';

const GROUP_SPECIES: Record<SpeciesGroup, readonly FarmSpecies[]> = {
  POULTRY: ['POULTRY'],
  SHEEP_CATTLE: ['SHEEP', 'CATTLE'],
};

/**
 * Route `/(app)/farms?species=POULTRY|SHEEP_CATTLE` — the paginated "see all"
 * for one farm-species group, opened from a landing screen's "عرض الكل". Renders
 * only that group's farms, never other organization types.
 */
export default function MyFarmsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const { t: ts } = useTranslation('sheepCattleFarm');
  const { species } = useLocalSearchParams<{ species?: string }>();
  const group: SpeciesGroup = species === 'SHEEP_CATTLE' ? 'SHEEP_CATTLE' : 'POULTRY';
  const isPoultry = group === 'POULTRY';

  const q = useMyFarms(GROUP_SPECIES[group], { pageSize: 20 });

  const title = isPoultry ? t('landing.myFarmsTitle') : ts('landing.sectionTitle');

  const renderItem = ({ item }: { item: MyOrganization }) => {
    if (isPoultry) {
      return (
        <PoultryFarmCard
          name={item.name}
          location={item.description}
          stats={null}
          status={item.status}
          onPressDetails={() => router.push(Routes.poultryFarmDetail(item.id))}
        />
      );
    }
    if (item.farmSpecies === 'CATTLE') {
      return (
        <CattleFarmCard
          name={item.name}
          location={item.description}
          stats={null}
          status={item.status}
          onPressDetails={() => router.push(Routes.cattleFarmDetail(item.id))}
        />
      );
    }
    return (
      <SheepFarmCard
        name={item.name}
        location={item.description}
        stats={null}
        status={item.status}
        onPressDetails={() => router.push(Routes.sheepFarmDetail(item.id))}
      />
    );
  };

  return (
    <SafeAreaScreen>
      <AppHeader title={title} showBack />

      {q.isLoading ? (
        <View
          style={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
            rowGap: theme.spacing.md,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <PoultryCardSkeleton key={i} />
          ))}
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.farms}
          keyExtractor={(o) => o.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState
              icon={isPoultry ? 'egg-outline' : 'paw-outline'}
              title={isPoultry ? t('landing.empty') : ts('landing.empty')}
              message={isPoultry ? t('landing.emptyHint') : ts('landing.emptyHint')}
            />
          }
          ListFooterComponent={q.isFetchingNextPage ? <Loading /> : null}
          contentContainerStyle={{
            padding: theme.screenPadding,
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
