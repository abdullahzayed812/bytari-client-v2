import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/content';
import { EmptyState, ErrorState } from '@/components/feedback';
import { Section } from '@/components/layout';
import { Heading, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { Advertisement } from '@/features/ads';
import { HomeSectionHeader } from '@/features/home/components';
import { NewsCard } from '@/features/news/components';
import { useNews } from '@/features/news/hooks';
// Deep import — avoids a farm ⇄ poultryMarket barrel require cycle.
import { useTraderStatus } from '@/features/poultryMarket/hooks/useTraderStatus';
import { TipCard } from '@/features/tips/components';
import { useTips } from '@/features/tips/hooks';
import { useTheme } from '@/theme';

import { AddFarmCard, MarketNavCard, PoultryCardSkeleton, PoultryFarmCard } from '../components';
import type { FarmBirdStats } from '../components';
import { usePoultryFarms, usePoultryFlocks } from '../hooks';
import type { PoultryFlock } from '../types';

function birdStats(flocks: PoultryFlock[]): FarmBirdStats {
  const s: FarmBirdStats = { total: 0, chicken: 0, turkey: 0, duck: 0, other: 0 };
  for (const f of flocks) {
    s.total += f.birdCount;
    if (f.birdType === 'CHICKEN') s.chicken += f.birdCount;
    else if (f.birdType === 'TURKEY') s.turkey += f.birdCount;
    else if (f.birdType === 'DUCK') s.duck += f.birdCount;
    else s.other += f.birdCount;
  }
  return s;
}

/** Poultry Farms landing (Home → "الدواجن والطيور"). Reuses the ad slot, the
 *  membership-scoped org list, and the dedicated news / tips feeds. */
export default function PoultryFarmsLandingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('poultry');
  const { width } = useWindowDimensions();

  const farms = usePoultryFarms();
  const trader = useTraderStatus();
  const farmPreview = farms.farms.slice(0, 3);
  const primaryFarm = farms.farms[0];
  const flocks = usePoultryFlocks(primaryFarm?.id, {
    pageSize: 100,
    enabled: Boolean(primaryFarm),
  });
  const news = useNews({ pageSize: 6 });
  const tips = useTips({ pageSize: 6 });

  const stats = useMemo(
    () => (primaryFarm && flocks.flocks.length > 0 ? birdStats(flocks.flocks) : null),
    [primaryFarm, flocks.flocks],
  );

  const cardWidth = width - theme.screenPadding * 2;
  const newsWidth = Math.min(220, cardWidth * 0.62);
  const tipWidth = Math.min(200, cardWidth * 0.56);
  const farmWidth = Math.min(320, cardWidth * 0.86);

  const refreshing =
    (farms.isRefetching || news.isRefetching || tips.isRefetching) && !farms.isLoading;
  const onRefresh = (): void => {
    void farms.refetch();
    void flocks.refetch();
    void news.refetch();
    void tips.refetch();
  };

  const goHome = (): void => (router.canGoBack() ? router.back() : router.push(Routes.home));
  const goCreateFarm = (): void => router.push(Routes.poultryFarmCreate);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.screenPadding,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.md,
          borderBottomWidth: theme.sizes.hairline,
          borderBottomColor: theme.colors.divider,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
          <Icon name="egg" size="iconLg" color="primary" />
          <Heading level={3}>{t('landing.title')}</Heading>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('landing.homeA11y')}
          onPress={goHome}
          hitSlop={8}
          style={({ pressed }) => [
            { flexDirection: 'row', alignItems: 'center', columnGap: 2 },
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text variant="label" color="primary">
            {t('landing.homeA11y')}
          </Text>
          <Icon name="chevron-back" size="iconSm" color="primary" directional />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.screenPadding,
          paddingTop: theme.spacing.xl,
          paddingBottom: theme.spacing.huge,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <Section spacing="xl">
          <Advertisement placement="POULTRY_FARMS" />
        </Section>

        <Section spacing="md">
          <AddFarmCard onPress={goCreateFarm} />
        </Section>

        <Section spacing="xl">
          <MarketNavCard
            icon="trending-up-outline"
            title={t('landing.marketTitle')}
            subtitle={t('landing.marketSubtitle')}
            onPress={() =>
              trader.isApproved ? router.push(Routes.marketHub) : router.push(Routes.traderRegister)
            }
          />
        </Section>

        <Section spacing="xl">
          <HomeSectionHeader
            title={t('landing.myFarmsTitle')}
            actionLabel={farms.farms.length > 3 ? t('landing.viewAll') : undefined}
            onAction={
              farms.farms.length > 3
                ? () => router.push({ pathname: Routes.myFarms, params: { species: 'POULTRY' } })
                : undefined
            }
          />
          {farms.isLoading ? (
            <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
              <PoultryCardSkeleton width={farmWidth} />
              <PoultryCardSkeleton width={farmWidth} />
            </View>
          ) : farms.isError ? (
            <ErrorState error={farms.error} onRetry={() => void farms.refetch()} />
          ) : farms.farms.length === 0 ? (
            <EmptyState
              icon="egg-outline"
              title={t('landing.empty')}
              message={t('landing.emptyHint')}
              actionLabel={t('landing.addFarmTitle')}
              onAction={goCreateFarm}
            />
          ) : (
            <FlatList
              data={farmPreview}
              keyExtractor={(farm) => farm.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ width: theme.spacing.md }} />}
              renderItem={({ item: farm }) => (
                <PoultryFarmCard
                  name={farm.name}
                  imageUrl={farm.imageUrl}
                  location={
                    [farm.governorate, farm.location].filter(Boolean).join(' · ') ||
                    farm.address ||
                    farm.description
                  }
                  stats={farm.id === primaryFarm?.id ? stats : null}
                  status={farm.status}
                  width={farmWidth}
                  onPressDetails={() => router.push(Routes.poultryFarmDetail(farm.id))}
                />
              )}
            />
          )}
        </Section>

        <Section spacing="xl">
          <HomeSectionHeader
            title={t('landing.newsTitle')}
            actionLabel={t('landing.viewAll')}
            onAction={() => router.push(Routes.news)}
          />
          {news.isLoading ? (
            <PoultryCardSkeleton />
          ) : news.news.length === 0 ? (
            <EmptyState icon="newspaper-outline" title={t('common.error')} />
          ) : (
            <FlatList
              data={news.news}
              keyExtractor={(i) => i.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ width: theme.spacing.md }} />}
              renderItem={({ item }) => (
                <NewsCard
                  item={item}
                  width={newsWidth}
                  onPress={() => router.push(Routes.newsDetail(item.id))}
                />
              )}
            />
          )}
        </Section>

        <Section spacing="huge">
          <HomeSectionHeader
            title={t('landing.tipsTitle')}
            actionLabel={t('landing.viewAll')}
            onAction={() => router.push(Routes.tips)}
          />
          {tips.isLoading ? (
            <PoultryCardSkeleton />
          ) : tips.tips.length === 0 ? (
            <EmptyState icon="bulb-outline" title={t('common.error')} />
          ) : (
            <FlatList
              data={tips.tips}
              keyExtractor={(i) => i.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ width: theme.spacing.md }} />}
              renderItem={({ item }) => (
                <TipCard
                  tip={item}
                  width={tipWidth}
                  onPress={() => router.push(Routes.tip(item.id))}
                />
              )}
            />
          )}
        </Section>
      </ScrollView>
    </View>
  );
}
