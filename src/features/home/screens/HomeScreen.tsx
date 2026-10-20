import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, View } from 'react-native';

import { Card, Icon, type IconName } from '@/components/content';
import { EmptyState } from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { Advertisement } from '@/features/ads';
import { useFeaturedOrganizations, useHomeSectionImages } from '@/features/homeSections/hooks';
import { useDiscoverOrganizations } from '@/features/organizations';
import type { PublicOrganization } from '@/features/organizations/types';
import { ThreadCard, ThreadCardSkeleton, useMyThreads } from '@/features/support';
import { useTheme } from '@/theme';

import { HomeHeader, HomeSectionHeader, OrganizationsCarousel } from '../components';

const PREVIEW_COUNT = 3;
const CONSULT_CARD_WIDTH = 280;

interface CategoryCardProps {
  icon: IconName;
  /** Admin-managed image shown in place of `icon` (falls back to the icon when absent). */
  imageUrl?: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  flex?: number;
}

function CategoryCard({ icon, imageUrl, title, subtitle, onPress, flex }: CategoryCardProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flex,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.surfaceAccent,
          rowGap: theme.spacing.md,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Row justify="space-between" align="flex-start">
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Icon name={icon} size="iconMd" color="primary" />
          )}
        </View>
        <Icon name="chevron-forward" directional size="iconSm" color="primary" />
      </Row>
      <View style={{ rowGap: 2 }}>
        <Text variant="bodyStrong">{title}</Text>
        <Caption>{subtitle}</Caption>
      </View>
    </Pressable>
  );
}

/**
 * Pet Owner Home — matches the reference design: header (avatar/greeting +
 * search/notifications/chat), the admin-curated ad carousel, a "send a
 * consultation now" CTA, a preview of the caller's own consultations, nearby
 * clinics, and a static "Sections" grid. Sections that used to live here
 * inline (notifications, chat, my-pets preview, community, knowledge,
 * services hub) are all still reachable — via the header icons or the
 * Services tab — just no longer duplicated on Home.
 */
export default function HomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('home');
  const { t: ts } = useTranslation('support');
  const { t: torg } = useTranslation('organizations');

  const consultations = useMyThreads('CONSULTATION', { pageSize: PREVIEW_COUNT });
  const consultationPreview = consultations.threads.slice(0, PREVIEW_COUNT);
  const featured = useFeaturedOrganizations('PET_OWNER_HOME');
  const clinics = useDiscoverOrganizations({ type: 'CLINIC', pageSize: 10 });
  const sectionImages = useHomeSectionImages();
  // Admin-featured clinics ("العيادات المميزة") first; with none active right
  // now the carousel shows the available clinics, as this section always did.
  const hasFeatured = (featured.data?.length ?? 0) > 0;
  const carouselItems = hasFeatured ? (featured.data ?? []) : clinics.organizations;
  const openOrganization = (org: PublicOrganization): void => {
    router.push(
      org.type === 'VETERINARY_OFFICE'
        ? Routes.veterinaryOfficeDetail(org.id)
        : Routes.organizationDiscoverDetail(org.id),
    );
  };

  return (
    <ScrollScreen>
      <Section spacing="xl">
        <HomeHeader />
      </Section>

      <Section spacing="xl">
        <Advertisement placement="HOME" />
      </Section>

      {/* Send a consultation now. */}
      <Section spacing="xl">
        <Card variant="outlined" padding="lg">
          <Row gap="lg" align="center">
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: theme.radius.pill,
                backgroundColor: theme.colors.surfaceAccent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="chatbubbles-outline" size="iconLg" color="primary" />
            </View>
            <View style={{ flex: 1, rowGap: 2 }}>
              <Text variant="bodyStrong" style={{ textAlign: 'center' }}>
                {ts('home.ctaTitle')}
              </Text>
              <Caption style={{ textAlign: 'center' }}>{ts('home.ctaSubtitle')}</Caption>
            </View>
          </Row>
          <View style={{ marginTop: theme.spacing.lg }}>
            <Card
              variant="flat"
              padding="md"
              style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg }}
              onPress={() => router.push(Routes.supportCreate('consultations'))}
              accessibilityLabel={ts('home.ctaButton')}
            >
              <Row justify="center" gap="sm">
                <Text variant="bodyMedium" style={{ color: theme.colors.onPrimary }}>
                  {ts('home.ctaButton')}
                </Text>
                <Icon name="send" size="iconSm" color="onPrimary" directional />
              </Row>
            </Card>
          </View>
        </Card>
      </Section>

      {/* Previous consultations. */}
      <Section spacing="xl">
        <HomeSectionHeader
          title={ts('home.previousTitle')}
          actionLabel={consultationPreview.length > 0 ? ts('home.viewAll') : undefined}
          onAction={() => router.push(Routes.support('consultations'))}
        />
        {consultations.isLoading ? (
          <Row gap="md">
            <ThreadCardSkeleton width={CONSULT_CARD_WIDTH} />
            <ThreadCardSkeleton width={CONSULT_CARD_WIDTH} />
          </Row>
        ) : consultationPreview.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            title={ts('home.emptyTitle')}
            message={ts('home.emptyMessage')}
          />
        ) : (
          <FlatList
            data={consultationPreview}
            keyExtractor={(thr) => thr.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ width: theme.spacing.md }} />}
            renderItem={({ item }) => (
              <ThreadCard
                thread={item}
                width={CONSULT_CARD_WIDTH}
                onPress={() => router.push(Routes.supportThread('consultations', item.id))}
              />
            )}
          />
        )}
      </Section>

      {/* Featured clinics (admin-curated) — auto-moving carousel. */}
      <Section spacing="xl">
        <HomeSectionHeader
          title={hasFeatured ? t('featured.title') : torg('home.clinicsTitle')}
          actionLabel={carouselItems.length > 0 ? torg('home.viewAll') : undefined}
          onAction={() => router.push(Routes.organizationsDiscover)}
        />
        {carouselItems.length === 0 && !clinics.isLoading && !featured.isLoading ? (
          <EmptyState icon="medkit-outline" title={torg('home.emptyTitle')} />
        ) : (
          <OrganizationsCarousel
            organizations={carouselItems}
            onPressOrganization={openOrganization}
          />
        )}
      </Section>

      {/* Sections. */}
      <Section spacing="giant">
        <HomeSectionHeader title={t('categories.title')} />
        <View style={{ rowGap: theme.spacing.md }}>
          <Row gap="md" align="stretch">
            <CategoryCard
              flex={1}
              icon="paw"
              imageUrl={sectionImages.PET_OWNER_PETS}
              title={t('categories.pets.title')}
              subtitle={t('categories.pets.subtitle')}
              onPress={() => router.push(Routes.petsLanding)}
            />
            <CategoryCard
              flex={1}
              icon="leaf-outline"
              imageUrl={sectionImages.PET_OWNER_LIVESTOCK}
              title={t('categories.livestock.title')}
              subtitle={t('categories.livestock.subtitle')}
              onPress={() => router.push(Routes.sheepCattleFarms)}
            />
          </Row>
          <CategoryCard
            icon="egg-outline"
            imageUrl={sectionImages.PET_OWNER_POULTRY}
            title={t('categories.poultry.title')}
            subtitle={t('categories.poultry.subtitle')}
            onPress={() => router.push(Routes.poultryFarms)}
          />
        </View>
      </Section>
    </ScrollScreen>
  );
}
