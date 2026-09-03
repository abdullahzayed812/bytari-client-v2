import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, View } from 'react-native';

import { Card, Icon, type IconName } from '@/components/content';
import { EmptyState, useToast } from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { Advertisement } from '@/features/ads';
import { ClinicCard, useDiscoverOrganizations } from '@/features/organizations';
import { ThreadCard, ThreadCardSkeleton, useMyThreads } from '@/features/support';
import { useTheme } from '@/theme';

import { HomeHeader, HomeSectionHeader } from '../components';

const PREVIEW_COUNT = 3;
const CLINIC_CARD_WIDTH = 220;

interface CategoryCardProps {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  flex?: number;
}

function CategoryCard({ icon, title, subtitle, onPress, flex }: CategoryCardProps) {
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
          }}
        >
          <Icon name={icon} size="iconMd" color="primary" />
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
  const { t: tc } = useTranslation('common');
  const toast = useToast();

  const consultations = useMyThreads('CONSULTATION', { pageSize: PREVIEW_COUNT });
  const consultationPreview = consultations.threads.slice(0, PREVIEW_COUNT);
  const clinics = useDiscoverOrganizations({ type: 'CLINIC', pageSize: 10 });

  const comingSoon = () => toast.show({ message: tc('comingSoon'), tone: 'info' });

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
              <Text variant="bodyStrong">{ts('home.ctaTitle')}</Text>
              <Caption>{ts('home.ctaSubtitle')}</Caption>
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
          <View style={{ rowGap: theme.spacing.md }}>
            <ThreadCardSkeleton />
          </View>
        ) : consultationPreview.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            title={ts('home.emptyTitle')}
            message={ts('home.emptyMessage')}
          />
        ) : (
          <View style={{ rowGap: theme.spacing.md }}>
            {consultationPreview.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                onPress={() => router.push(Routes.supportThread('consultations', thread.id))}
              />
            ))}
          </View>
        )}
      </Section>

      {/* Available clinics. */}
      <Section spacing="xl">
        <HomeSectionHeader
          title={torg('home.clinicsTitle')}
          actionLabel={clinics.organizations.length > 0 ? torg('home.viewAll') : undefined}
          onAction={() => router.push(Routes.organizationsDiscover)}
        />
        {clinics.organizations.length === 0 && !clinics.isLoading ? (
          <EmptyState icon="medkit-outline" title={torg('home.emptyTitle')} />
        ) : (
          <FlatList
            data={clinics.organizations}
            keyExtractor={(o) => o.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ width: theme.spacing.md }} />}
            renderItem={({ item }) => (
              <ClinicCard
                organization={item}
                width={CLINIC_CARD_WIDTH}
                onPress={() => router.push(Routes.organizationDiscoverDetail(item.id))}
              />
            )}
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
              title={t('categories.pets.title')}
              subtitle={t('categories.pets.subtitle')}
              onPress={() => router.push(Routes.petsLanding)}
            />
            <CategoryCard
              flex={1}
              icon="leaf-outline"
              title={t('categories.livestock.title')}
              subtitle={t('categories.livestock.subtitle')}
              onPress={comingSoon}
            />
          </Row>
          <CategoryCard
            icon="egg-outline"
            title={t('categories.poultry.title')}
            subtitle={t('categories.poultry.subtitle')}
            onPress={() => router.push(Routes.poultryFarms)}
          />
        </View>
      </Section>
    </ScrollScreen>
  );
}
