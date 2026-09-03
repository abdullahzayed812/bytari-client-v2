import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  useWindowDimensions,
  View,
  type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/actions';
import { Icon } from '@/components/content';
import { EmptyState, ErrorState } from '@/components/feedback';
import { Row, Section } from '@/components/layout';
import { Heading, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { Advertisement, useAds } from '@/features/ads';
import { HomeSectionHeader } from '@/features/home/components';
import { useTheme } from '@/theme';

import { FeatureCard, PetCardSkeleton, PetShowcaseCard } from '../components';
import { usePets } from '../hooks';
import type { Pet } from '../types';

/**
 * Pet Owner "Pets" discovery landing (Home → "الحيوانات الأليفة"). Reuses the
 * admin-curated banner carousel and the owner-scoped `GET /animals` list; the
 * "my profiles" section links through to `MyPetsScreen`, and the four entry
 * cards open the existing community / knowledge browsers. No new backend.
 */
export default function PetsLandingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('pets');
  const { width } = useWindowDimensions();

  const ads = useAds('PETS');
  const pets = usePets({ pageSize: 10 });

  const [activeIndex, setActiveIndex] = useState(0);
  const onViewRef = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (typeof first?.index === 'number') setActiveIndex(first.index);
  });
  const viewCfgRef = useRef({ itemVisiblePercentThreshold: 60 });

  const cardWidth = width - theme.screenPadding * 2;

  const goHome = () => (router.canGoBack() ? router.back() : router.push(Routes.home));
  const goMyPets = () => router.push(Routes.pets);
  const goAddPet = () => router.push(Routes.petsCreate);
  const goTransferRequests = () => router.push(Routes.petTransferRequests);

  const refreshing = (ads.isRefetching || pets.isRefetching) && !pets.isFetchingNextPage;
  const onRefresh = () => {
    void ads.refetch();
    void pets.refetch();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
      {/* Page header — brand mark + title (start), back-to-home (end). */}
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
            {t('landing.home')}
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
        {/* Advertisement — admin-curated `GET /ads?placement=PETS` (banner or carousel). */}
        <Section spacing="xl">
          <Advertisement placement="PETS" />
        </Section>

        {/* Ownership transfer requests — sent + received. */}
        <Section spacing="xl">
          <Button
            label={t('landing.transferRequestsA11y')}
            variant="outline"
            leftIcon="swap-horizontal-outline"
            fullWidth
            onPress={goTransferRequests}
            accessibilityLabel={t('landing.transferRequestsA11y')}
          />
        </Section>

        {/* My pet profiles → MyPetsScreen. */}
        <Section spacing="xl">
          <HomeSectionHeader
            title={t('landing.myProfilesTitle')}
            actionLabel={t('landing.viewAll')}
            onAction={goMyPets}
          />

          {pets.isLoading ? (
            <PetCardSkeleton />
          ) : pets.isError ? (
            <ErrorState error={pets.error} onRetry={() => void pets.refetch()} />
          ) : pets.pets.length === 0 ? (
            <EmptyState
              icon="paw-outline"
              title={t('landing.empty')}
              message={t('landing.emptyHint')}
              actionLabel={t('landing.addPet')}
              onAction={goAddPet}
            />
          ) : (
            <View style={{ rowGap: theme.spacing.sm }}>
              <FlatList
                data={pets.pets}
                keyExtractor={(p: Pet) => p.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                getItemLayout={(_, index) => ({
                  length: cardWidth,
                  offset: cardWidth * index,
                  index,
                })}
                viewabilityConfig={viewCfgRef.current}
                onViewableItemsChanged={onViewRef.current}
                renderItem={({ item }) => (
                  <PetShowcaseCard
                    pet={item}
                    width={cardWidth}
                    onPress={() => router.push(Routes.petDetail(item.id))}
                  />
                )}
              />
              {pets.pets.length > 1 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    columnGap: theme.spacing.xs,
                  }}
                >
                  {pets.pets.map((p, index) => (
                    <View
                      key={p.id}
                      style={{
                        width: index === activeIndex ? 18 : 6,
                        height: 6,
                        borderRadius: theme.radius.pill,
                        backgroundColor:
                          index === activeIndex ? theme.colors.primary : theme.colors.border,
                      }}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          )}
        </Section>

        {/* Community & knowledge entry cards. */}
        <Section spacing="huge">
          <View style={{ rowGap: theme.spacing.md }}>
            <Row gap="md" align="stretch">
              <FeatureCard
                title={t('landing.cards.tipsTitle')}
                subtitle={t('landing.cards.tipsSubtitle')}
                icon="bulb-outline"
                surface="featureTipsSurface"
                accent="featureTipsAccent"
                accessibilityLabel={t('landing.cards.openA11y', {
                  title: t('landing.cards.tipsTitle'),
                })}
                onPress={() => router.push(Routes.tips)}
              />
              <FeatureCard
                title={t('landing.cards.adoptionTitle')}
                subtitle={t('landing.cards.adoptionSubtitle')}
                icon="heart-outline"
                surface="featureAdoptionSurface"
                accent="featureAdoptionAccent"
                accessibilityLabel={t('landing.cards.openA11y', {
                  title: t('landing.cards.adoptionTitle'),
                })}
                onPress={() => router.push(Routes.publications('adoption'))}
              />
            </Row>
            <Row gap="md" align="stretch">
              <FeatureCard
                title={t('landing.cards.matingTitle')}
                subtitle={t('landing.cards.matingSubtitle')}
                icon="male-female-outline"
                surface="featureMatingSurface"
                accent="featureMatingAccent"
                accessibilityLabel={t('landing.cards.openA11y', {
                  title: t('landing.cards.matingTitle'),
                })}
                onPress={() => router.push(Routes.publications('mating'))}
              />
              <FeatureCard
                title={t('landing.cards.lostTitle')}
                subtitle={t('landing.cards.lostSubtitle')}
                icon="search-outline"
                surface="featureLostSurface"
                accent="featureLostAccent"
                badgeLabel={t('landing.cards.lostBadge')}
                accessibilityLabel={t('landing.cards.openA11y', {
                  title: t('landing.cards.lostTitle'),
                })}
                onPress={() => router.push(Routes.publications('lost'))}
              />
            </Row>
          </View>
        </Section>
      </ScrollView>
    </View>
  );
}
