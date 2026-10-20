import { router } from 'expo-router';
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
import { THREE_UP_COUNT, Section } from '@/components/layout';
import { Heading, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { Advertisement } from '@/features/ads';
// Deep import — keeps the farm barrel (and its screens) out of the require graph.
import { useMyFarms } from '@/features/farm/hooks/useMyFarms';
import { HomeSectionHeader } from '@/features/home/components';
import { NewsSectionPreview } from '@/features/news/components';
import { useNews } from '@/features/news/hooks';
import type { MyOrganization } from '@/features/organizations/types';
import { TipsSectionPreview } from '@/features/tips/components';
import { useTips } from '@/features/tips/hooks';
import { physicalRow } from '@/lib/rtl';
import { useTheme } from '@/theme';

import { CattleFarmCard, SheepFarmCard } from '../components';

/** One farm row — the card variant follows the row's own `farmSpecies` (now on the list DTO). */
function FarmListRow({ farm, width }: { farm: MyOrganization; width?: number }) {
  if (farm.farmSpecies === 'CATTLE') {
    return (
      <CattleFarmCard
        name={farm.name}
        imageUrl={farm.imageUrl}
        location={
          [farm.governorate, farm.location].filter(Boolean).join(' · ') ||
          farm.address ||
          farm.description
        }
        stats={null}
        status={farm.status}
        width={width}
        onPressDetails={() => router.push(Routes.cattleFarmDetail(farm.id))}
      />
    );
  }
  return (
    <SheepFarmCard
      name={farm.name}
      imageUrl={farm.imageUrl}
      location={
        [farm.governorate, farm.location].filter(Boolean).join(' · ') ||
        farm.address ||
        farm.description
      }
      stats={null}
      status={farm.status}
      width={width}
      onPressDetails={() => router.push(Routes.sheepFarmDetail(farm.id))}
    />
  );
}

/** Sheep Farms & Cattle Farms landing (Home → "الأغنام والأبقار"). Mirrors `PoultryFarmsLandingScreen` exactly. */
export default function SheepCattleFarmsLandingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('sheepCattleFarm');

  const farms = useMyFarms(['SHEEP', 'CATTLE']);
  const farmPreview = farms.farms.slice(0, 3);
  // Same sizing as the poultry landing — a peek of the next card, never wider than the screen.
  const { width: windowWidth } = useWindowDimensions();
  const farmWidth = Math.min(320, (windowWidth - theme.screenPadding * 2) * 0.86);
  // Sheep + cattle feeds only (additional corrections §11).
  // Same query keys as the three-card previews below — pull-to-refresh refetches them.
  const news = useNews({ pageSize: THREE_UP_COUNT, sections: ['SHEEP', 'CATTLE'] });
  const tips = useTips({ pageSize: THREE_UP_COUNT, sections: ['SHEEP', 'CATTLE'] });

  const isLoading = farms.isLoading;
  const isError = farms.isError;

  const refreshing = (farms.isRefetching || news.isRefetching || tips.isRefetching) && !isLoading;
  const onRefresh = (): void => {
    void farms.refetch();
    void news.refetch();
    void tips.refetch();
  };

  const goHome = (): void => (router.canGoBack() ? router.back() : router.push(Routes.home));

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
      <View
        style={{
          // The home (back) link is pinned to the physical left (lib/rtl convention).
          flexDirection: physicalRow(),
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.screenPadding,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.md,
          borderBottomWidth: theme.sizes.hairline,
          borderBottomColor: theme.colors.divider,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('landing.homeA11y')}
          onPress={goHome}
          hitSlop={8}
          style={({ pressed }) => [
            { flexDirection: physicalRow(), alignItems: 'center', columnGap: 2 },
            pressed && { opacity: 0.6 },
          ]}
        >
          <Icon name="chevron-back" size="iconSm" color="primary" />
          <Text variant="label" color="primary">
            {t('landing.homeA11y')}
          </Text>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
          <Icon name="paw" size="iconLg" color="primary" />
          <Heading level={3}>{t('landing.title')}</Heading>
        </View>
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
          <Advertisement placement="SHEEP_FARMS" />
        </Section>

        <Section spacing="md">
          <Heading level={3}>{t('landing.sectionTitle')}</Heading>
        </Section>

        <Section spacing="xl">
          {/* Side by side when both labels fit; wraps to a stacked pair on narrow phones. */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
            <View style={{ flexGrow: 1, flexBasis: 160 }}>
              <AddFarmButton
                icon="paw-outline"
                label={t('landing.addCattleFarm')}
                onPress={() => router.push(Routes.cattleFarmCreate)}
              />
            </View>
            <View style={{ flexGrow: 1, flexBasis: 160 }}>
              <AddFarmButton
                icon="paw-outline"
                label={t('landing.addSheepFarm')}
                onPress={() => router.push(Routes.sheepFarmCreate)}
              />
            </View>
          </View>
        </Section>

        <Section spacing="xl">
          <HomeSectionHeader
            title={t('landing.myFarmsTitle')}
            actionLabel={farms.farms.length > 3 ? t('landing.viewAll') : undefined}
            onAction={
              farms.farms.length > 3
                ? () =>
                    router.push({
                      pathname: Routes.myFarms,
                      params: { species: 'SHEEP_CATTLE' },
                    })
                : undefined
            }
          />
          {isLoading ? null : isError ? (
            <ErrorState error={farms.error} onRetry={() => void farms.refetch()} />
          ) : farms.farms.length === 0 ? (
            <EmptyState
              icon="paw-outline"
              title={t('landing.empty')}
              message={t('landing.emptyHint')}
            />
          ) : (
            <FlatList
              data={farmPreview}
              keyExtractor={(farm) => farm.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ width: theme.spacing.md }} />}
              renderItem={({ item }) => <FarmListRow farm={item} width={farmWidth} />}
            />
          )}
        </Section>

        <Section spacing="xl">
          <HomeSectionHeader
            title={t('landing.newsTitle')}
            actionLabel={t('landing.viewAll')}
            onAction={() =>
              router.push({ pathname: '/(app)/news', params: { section: 'SHEEP,CATTLE' } })
            }
          />
          <NewsSectionPreview sections={['SHEEP', 'CATTLE']} />
        </Section>

        <Section spacing="huge">
          <HomeSectionHeader
            title={t('landing.tipsTitle')}
            actionLabel={t('landing.viewAll')}
            onAction={() =>
              router.push({ pathname: '/(app)/tips', params: { section: 'SHEEP,CATTLE' } })
            }
          />
          <TipsSectionPreview sections={['SHEEP', 'CATTLE']} />
        </Section>
      </ScrollView>
    </View>
  );
}

function AddFarmButton({
  icon,
  label,
  onPress,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          columnGap: theme.spacing.sm,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.primary,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Icon name="add-circle" size="iconMd" color="onPrimary" />
      <Icon name={icon} size="iconSm" color="onPrimary" />
      <Text
        variant="bodyMedium"
        style={{ color: theme.colors.onPrimary, flexShrink: 1, textAlign: 'center' }}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}
