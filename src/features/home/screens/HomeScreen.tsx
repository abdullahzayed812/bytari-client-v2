import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge, Card, Icon } from '@/components/content';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { Caption, Heading, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useConversations } from '@/features/chat/hooks';
import { useUnreadCount } from '@/features/notifications/hooks';
import { PetCard, PetCardSkeleton, usePets } from '@/features/pets';
import { useAppMode, useAuth } from '@/hooks';
import { useAppHeaderGreeting } from '@/navigation/useAppHeaderGreeting';
import { useTheme } from '@/theme';

import { HomeSectionHeader } from '../components/HomeSectionHeader';

const PREVIEW_COUNT = 3;

/**
 * Pet Owner Home (§3). Real data for the "My Pets" summary; every other section
 * that belongs to a later phase is a clean disabled / "coming soon" placeholder.
 * Works in Veterinarian mode too — pet data is owner-scoped by the backend
 * regardless of role.
 */
export default function HomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('pets');
  const { t: tn } = useTranslation('notifications');
  const { t: tch } = useTranslation('chat');
  const { t: tc } = useTranslation('common');
  const { t: tp } = useTranslation('publications');
  const { t: tk } = useTranslation('content');
  const { t: ts } = useTranslation('support');
  const { t: tnav } = useTranslation('nav');
  const greeting = useAppHeaderGreeting();
  const { user } = useAuth();
  const { activeMode } = useAppMode();

  const pets = usePets({ pageSize: PREVIEW_COUNT });
  const preview = pets.pets.slice(0, PREVIEW_COUNT);
  const { data: unread = 0 } = useUnreadCount();
  const { unreadTotal: chatUnread } = useConversations({ pageSize: 20 });

  return (
    <ScrollScreen>
      <Section spacing="xl">
        <Row justify="space-between" align="flex-start">
          <View style={{ flex: 1 }}>
            <Caption>{greeting}</Caption>
            <Heading level={2} numberOfLines={1}>
              {user ? `${user.firstName} ${user.lastName}`.trim() : tc('appName')}
            </Heading>
          </View>
          <View
            style={{
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xs,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.surfaceAccent,
            }}
          >
            <Text variant="overline" color="primary">
              {activeMode === 'veterinarian' ? tc('mode.veterinarian') : tc('mode.owner')}
            </Text>
          </View>
        </Row>
      </Section>

      {/* Notifications inbox (Phase 15). */}
      <Section spacing="xl">
        <Card
          variant="outlined"
          padding="lg"
          onPress={() => router.push(Routes.notifications)}
          accessibilityLabel={
            unread > 0 ? tn('bell.a11yWithCount', { count: unread }) : tn('bell.a11y')
          }
        >
          <Row gap="md">
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="notifications-outline" size="iconMd" color="primary" />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium">{tn('home.title')}</Text>
              <Caption>
                {unread > 0 ? tn('home.unread', { count: unread }) : tn('home.hint')}
              </Caption>
            </View>
            {unread > 0 ? (
              <Badge label={unread > 99 ? '99+' : String(unread)} tone="danger" size="sm" />
            ) : (
              <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
            )}
          </Row>
        </Card>
      </Section>

      {/* Chat — Pet Owner ↔ Clinic / Farm. */}
      <Section spacing="xl">
        <Card
          variant="outlined"
          padding="lg"
          onPress={() => router.push(Routes.chat)}
          accessibilityLabel={
            chatUnread > 0 ? tch('list.a11yUnread', { count: chatUnread }) : tch('home.title')
          }
        >
          <Row gap="md">
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="chatbubbles-outline" size="iconMd" color="primary" />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium">{tch('home.title')}</Text>
              <Caption>
                {chatUnread > 0 ? tch('home.unread', { count: chatUnread }) : tch('home.hint')}
              </Caption>
            </View>
            {chatUnread > 0 ? (
              <Badge label={chatUnread > 99 ? '99+' : String(chatUnread)} tone="danger" size="sm" />
            ) : (
              <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
            )}
          </Row>
        </Card>
      </Section>

      {/* My Pets summary — real data. */}
      <Section spacing="xl">
        <HomeSectionHeader
          title={t('home.myPetsTitle')}
          actionLabel={pets.pets.length > 0 ? t('home.viewAll') : undefined}
          onAction={() => router.push(Routes.pets)}
        />

        {pets.isLoading ? (
          <View style={{ rowGap: theme.spacing.md }}>
            <PetCardSkeleton />
            <PetCardSkeleton />
          </View>
        ) : preview.length === 0 ? (
          <Card variant="accent" onPress={() => router.push(Routes.petsCreate)}>
            <Row gap="md">
              <Icon name="add-circle-outline" size="iconLg" color="primary" />
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium">{t('home.addPet')}</Text>
                <Caption>{t('home.emptyHint')}</Caption>
              </View>
            </Row>
          </Card>
        ) : (
          <View style={{ rowGap: theme.spacing.md }}>
            {preview.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onPress={() => router.push(Routes.petDetail(pet.id))}
              />
            ))}
          </View>
        )}
      </Section>

      {/* Animal community — Adoption / Mating / Lost (Phase 8). */}
      <Section spacing="xl">
        <HomeSectionHeader title={tp('home.communityTitle')} />
        <View style={{ rowGap: theme.spacing.sm }}>
          {(
            [
              { slug: 'adoption', icon: 'heart-outline', label: tp('home.communityAdoption') },
              {
                slug: 'mating',
                icon: 'male-female-outline',
                label: tp('home.communityMating'),
              },
              { slug: 'lost', icon: 'search-outline', label: tp('home.communityLost') },
            ] as const
          ).map((item) => (
            <Card
              key={item.slug}
              variant="outlined"
              padding="md"
              onPress={() => router.push(Routes.publications(item.slug))}
              accessibilityLabel={item.label}
            >
              <Row gap="md">
                <Icon name={item.icon} size="iconMd" color="primary" />
                <Text variant="bodyMedium" style={{ flex: 1 }}>
                  {item.label}
                </Text>
                <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
              </Row>
            </Card>
          ))}
        </View>
      </Section>

      {/* Content & Knowledge (Phase 11). */}
      <Section spacing="xl">
        <HomeSectionHeader title={tk('home.title')} />
        <Card
          variant="outlined"
          padding="md"
          onPress={() => router.push(Routes.contentHome)}
          accessibilityLabel={tk('home.title')}
        >
          <Row gap="md">
            <Icon name="library-outline" size="iconMd" color="primary" />
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium">{tk('home.title')}</Text>
              <Caption>{tk('home.latestLabel')}</Caption>
            </View>
            <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
          </Row>
        </Card>
      </Section>

      {/* Consultations & Inquiries (Phase 13). */}
      <Section spacing="xl">
        <HomeSectionHeader title={ts('home.sectionTitle')} />
        <View style={{ rowGap: theme.spacing.sm }}>
          {(
            [
              {
                slug: 'consultations',
                icon: 'chatbubbles-outline',
                label: ts('home.consultations'),
              },
              { slug: 'inquiries', icon: 'help-buoy-outline', label: ts('home.inquiries') },
            ] as const
          ).map((item) => (
            <Card
              key={item.slug}
              variant="outlined"
              padding="md"
              onPress={() => router.push(Routes.support(item.slug))}
              accessibilityLabel={item.label}
            >
              <Row gap="md">
                <Icon name={item.icon} size="iconMd" color="primary" />
                <Text variant="bodyMedium" style={{ flex: 1 }}>
                  {item.label}
                </Text>
                <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
              </Row>
            </Card>
          ))}
        </View>
      </Section>

      {/* Services hub — one tap to everything else. */}
      <Section spacing="giant">
        <Card
          variant="outlined"
          padding="md"
          onPress={() => router.push(Routes.services)}
          accessibilityLabel={tnav('services.title')}
        >
          <Row gap="md">
            <Icon name="grid-outline" size="iconMd" color="primary" />
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium">{tnav('services.title')}</Text>
              <Caption>{tnav('services.subtitle')}</Caption>
            </View>
            <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
          </Row>
        </Card>
      </Section>
    </ScrollScreen>
  );
}
