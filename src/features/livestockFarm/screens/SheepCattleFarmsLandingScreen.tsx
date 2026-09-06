import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/content';
import { EmptyState, ErrorState } from '@/components/feedback';
import { Section } from '@/components/layout';
import { Heading, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { Advertisement } from '@/features/ads';
import { useFarmProfile } from '@/features/farm';
import { HomeSectionHeader } from '@/features/home/components';
import { NewsCard } from '@/features/news/components';
import { useNews } from '@/features/news/hooks';
import type { MyOrganization } from '@/features/organizations/types';
import { TipCard } from '@/features/tips/components';
import { useTips } from '@/features/tips/hooks';
import { useTheme } from '@/theme';

import { CattleFarmCard, SheepFarmCard } from '../components';
import { useCattleFarms, useSheepFarms } from '../hooks';
import type { LivestockFarmProfile } from '../types';

/** One farm row — resolves its own species (not present on the lightweight "my organizations" list). */
function FarmListRow({ farm }: { farm: MyOrganization }) {
  const profile = useFarmProfile(farm.id, { enabled: true });
  const p = profile.data as LivestockFarmProfile | undefined;
  const species = p?.farmSpecies;

  if (species === 'CATTLE') {
    return (
      <CattleFarmCard
        name={farm.name}
        profile={p}
        location={farm.description}
        stats={null}
        status={farm.status}
        onPressDetails={() => router.push(Routes.cattleFarmDetail(farm.id))}
      />
    );
  }
  // Default to Sheep while the profile is loading or for SHEEP/MIXED farms —
  // a MIXED farm's own Details screen shows both sections regardless of which
  // card variant the landing list uses to open it.
  return (
    <SheepFarmCard
      name={farm.name}
      profile={p}
      location={farm.description}
      stats={null}
      status={farm.status}
      onPressDetails={() => router.push(Routes.sheepFarmDetail(farm.id))}
    />
  );
}

/** Sheep Farms & Cattle Farms landing (Home → "الأغنام والأبقار"). Mirrors `PoultryFarmsLandingScreen` exactly. */
export default function SheepCattleFarmsLandingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('sheepCattleFarm');

  const sheepFarms = useSheepFarms();
  const cattleFarms = useCattleFarms();
  const news = useNews({ pageSize: 6 });
  const tips = useTips({ pageSize: 6 });

  // Both hooks return the SAME underlying "my FARM organizations" list (type
  // filter only, no species) — de-duplicate by id since a farm only needs one row.
  const farms = sheepFarms.farms.length >= cattleFarms.farms.length ? sheepFarms : cattleFarms;

  const isLoading = farms.isLoading;
  const isError = farms.isError;

  const refreshing = (farms.isRefetching || news.isRefetching || tips.isRefetching) && !isLoading;
  const onRefresh = (): void => {
    void sheepFarms.refetch();
    void cattleFarms.refetch();
    void news.refetch();
    void tips.refetch();
  };

  const goHome = (): void => (router.canGoBack() ? router.back() : router.push(Routes.home));

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
          <Icon name="paw" size="iconLg" color="primary" />
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
          <Advertisement placement="SHEEP_FARMS" />
        </Section>

        <Section spacing="md">
          <Heading level={3}>{t('landing.sectionTitle')}</Heading>
        </Section>

        <Section spacing="xl">
          <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
            <View style={{ flex: 1 }}>
              <AddFarmButton
                icon="paw-outline"
                label={t('landing.addCattleFarm')}
                onPress={() => router.push(Routes.cattleFarmCreate)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AddFarmButton
                icon="paw-outline"
                label={t('landing.addSheepFarm')}
                onPress={() => router.push(Routes.sheepFarmCreate)}
              />
            </View>
          </View>
        </Section>

        <Section spacing="xl">
          {isLoading ? null : isError ? (
            <ErrorState error={farms.error} onRetry={() => void farms.refetch()} />
          ) : farms.farms.length === 0 ? (
            <EmptyState icon="paw-outline" title={t('landing.empty')} message={t('landing.emptyHint')} />
          ) : (
            <View style={{ rowGap: theme.spacing.md }}>
              {farms.farms.map((farm) => (
                <FarmListRow key={farm.id} farm={farm} />
              ))}
            </View>
          )}
        </Section>

        <Section spacing="xl">
          <HomeSectionHeader
            title={t('landing.newsTitle')}
            actionLabel={t('landing.viewAll')}
            onAction={() => router.push(Routes.news)}
          />
          {news.news.length === 0 ? null : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
                {news.news.map((item) => (
                  <NewsCard key={item.id} item={item} width={220} onPress={() => router.push(Routes.newsDetail(item.id))} />
                ))}
              </View>
            </ScrollView>
          )}
        </Section>

        <Section spacing="huge">
          <HomeSectionHeader
            title={t('landing.tipsTitle')}
            actionLabel={t('landing.viewAll')}
            onAction={() => router.push(Routes.tips)}
          />
          {tips.tips.length === 0 ? null : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
                {tips.tips.map((tip) => (
                  <TipCard key={tip.id} tip={tip} width={200} onPress={() => router.push(Routes.tip(tip.id))} />
                ))}
              </View>
            </ScrollView>
          )}
        </Section>
      </ScrollView>
    </View>
  );
}

function AddFarmButton({ icon, label, onPress }: { icon: Parameters<typeof Icon>[0]['name']; label: string; onPress: () => void }) {
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
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.primary,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Icon name="add-circle" size="iconMd" color="onPrimary" />
      <Icon name={icon} size="iconSm" color="onPrimary" />
      <Text variant="bodyMedium" style={{ color: theme.colors.onPrimary }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
