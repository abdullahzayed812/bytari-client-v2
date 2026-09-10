import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Icon, type IconName } from '@/components/content';
import { EmptyState } from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { Advertisement } from '@/features/ads';
import { VeterinarianStatusBadge, useVeterinarianStatus } from '@/features/auth';
import { HomeSectionHeader } from '@/features/home/components';
import { ClinicCard, useDiscoverOrganizations } from '@/features/organizations';
import { ThreadCard, ThreadCardSkeleton, useMyThreads } from '@/features/support';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/colors';

import { VeterinarianHomeHeader } from '../components';
import { useVeterinarianApplicationStatus } from '../hooks';

const PREVIEW_COUNT = 3;
const INQUIRY_CARD_WIDTH = 260;

interface QuickLinkCardProps {
  icon: IconName;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  surfaceColor: string;
  accentColor: keyof ColorTokens;
  onPress: () => void;
}

function QuickLinkCard({
  icon,
  title,
  subtitle,
  ctaLabel,
  surfaceColor,
  accentColor,
  onPress,
}: QuickLinkCardProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flex: 1,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.xl,
          backgroundColor: surfaceColor,
          rowGap: theme.spacing.sm,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <Icon name={icon} size="iconLg" color={accentColor} />
      <View style={{ rowGap: 2 }}>
        <Text variant="bodyStrong">{title}</Text>
        <Caption numberOfLines={2}>{subtitle}</Caption>
      </View>
      {ctaLabel ? (
        <View
          style={{
            marginTop: theme.spacing.xs,
            alignSelf: 'flex-start',
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors[accentColor],
          }}
        >
          <Text variant="label" style={{ color: theme.colors.onPrimary }}>
            {ctaLabel}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/**
 * Veterinarian Home — matches the reference design: header (avatar/greeting +
 * search/notifications/chat/switch-to-owner-mode), the admin-curated ad
 * carousel, an inquiry CTA ("أرسل استفسارك") + preview of the vet's own
 * inquiries, a preview of the vet's own veterinary offices, and quick links to
 * chat, services, the magazine and books. Pull-to-refresh (not the header
 * icon) reloads the screen's data.
 *
 * The screen is capability-aware: an APPROVED vet sees the full experience; a
 * PENDING / REJECTED / not-applied user sees a clear status card + apply path
 * instead of the inquiry / organizations sections (creating or reading an
 * inquiry, and organization membership, both require APPROVED_VET backend
 * permissions). The backend remains the authority for every action.
 */
export default function VeterinarianHomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinarian');
  const vet = useVeterinarianStatus();
  const appStatus = useVeterinarianApplicationStatus({ enabled: vet.hasApplied });
  const rejectionReason = vet.isRejected
    ? (appStatus.data?.application?.decisionReason ?? null)
    : null;

  const inquiries = useMyThreads('INQUIRY', { pageSize: PREVIEW_COUNT, enabled: vet.isApproved });
  const inquiryPreview = inquiries.threads.slice(0, PREVIEW_COUNT);
  const offices = useDiscoverOrganizations({ type: 'VETERINARY_OFFICE', pageSize: PREVIEW_COUNT });
  const officePreview = offices.organizations.slice(0, PREVIEW_COUNT);

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries();
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return (
    <ScrollScreen
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        ),
      }}
    >
      <Section spacing="xl">
        <VeterinarianHomeHeader />
      </Section>

      <Section spacing="xl">
        <Advertisement placement="VETERINARIAN_HOME" />
      </Section>

      {/* Veterinarian approval status — only when not yet approved. */}
      {!vet.isApproved ? (
        <Section spacing="xl">
          <Label>{t('status.label')}</Label>
          <Card variant="outlined" padding="md">
            <Row justify="space-between">
              <Text variant="bodyMedium">{t(`status.${vet.status}`)}</Text>
              <VeterinarianStatusBadge status={vet.status} size="md" />
            </Row>

            {vet.isPending ? (
              <Caption style={{ marginTop: theme.spacing.sm }}>{t('status.pendingHint')}</Caption>
            ) : null}

            {vet.isRejected ? (
              <View style={{ marginTop: theme.spacing.sm, rowGap: theme.spacing.xs }}>
                <Caption>{t('status.rejectedHint')}</Caption>
                {rejectionReason ? (
                  <Text variant="caption" color="danger">
                    {t('status.rejectionReason', { reason: rejectionReason })}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {!vet.isPending ? (
              <View style={{ marginTop: theme.spacing.md }}>
                <Button
                  label={vet.isRejected ? t('apply.reapplyCta') : t('apply.cta')}
                  variant="primary"
                  size="sm"
                  onPress={() => router.push(Routes.veterinarianApply)}
                />
              </View>
            ) : null}
          </Card>
        </Section>
      ) : null}

      {/* Send an inquiry — approved vets only (backend: APPROVED_VET). */}
      {vet.isApproved ? (
        <Section spacing="xl">
          <Card variant="outlined" padding="lg">
            <Text variant="bodyMedium">{t('home.inquiryCta.title')}</Text>
            <View style={{ marginTop: theme.spacing.lg }}>
              <Card
                variant="flat"
                padding="md"
                style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg }}
                onPress={() => router.push(Routes.supportCreate('inquiries'))}
                accessibilityLabel={t('home.inquiryCta.button')}
              >
                <Row justify="center" gap="sm">
                  <Text variant="bodyMedium" style={{ color: theme.colors.onPrimary }}>
                    {t('home.inquiryCta.button')}
                  </Text>
                  <Icon name="send" size="iconSm" color="onPrimary" directional />
                </Row>
              </Card>
            </View>
          </Card>
        </Section>
      ) : null}

      {/* Previous inquiries — approved vets only. */}
      {vet.isApproved ? (
        <Section spacing="xl">
          <HomeSectionHeader
            title={t('home.previousInquiries.title')}
            actionLabel={inquiryPreview.length > 0 ? t('home.previousInquiries.viewAll') : undefined}
            onAction={() => router.push(Routes.support('inquiries'))}
          />
          {inquiries.isLoading ? (
            <Row gap="md">
              <ThreadCardSkeleton width={INQUIRY_CARD_WIDTH} />
              <ThreadCardSkeleton width={INQUIRY_CARD_WIDTH} />
            </Row>
          ) : inquiryPreview.length === 0 ? (
            <EmptyState
              icon="chatbubbles-outline"
              title={t('home.previousInquiries.empty')}
            />
          ) : (
            <FlatList
              data={inquiryPreview}
              keyExtractor={(thr) => thr.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ width: theme.spacing.md }} />}
              renderItem={({ item }) => (
                <ThreadCard
                  thread={item}
                  width={INQUIRY_CARD_WIDTH}
                  onPress={() => router.push(Routes.supportThread('inquiries', item.id))}
                />
              )}
            />
          )}
        </Section>
      ) : null}

      {/* Veterinary offices — public discovery, open to every signed-in user. */}
      <Section spacing="xl">
        <HomeSectionHeader
          title={t('home.organizations.title')}
          actionLabel={officePreview.length > 0 ? t('home.organizations.viewAll') : undefined}
          onAction={() => router.push(Routes.veterinaryOffices)}
        />
        {officePreview.length === 0 && !offices.isLoading ? (
          <EmptyState icon="business-outline" title={t('home.organizations.emptyTitle')} />
        ) : (
          <FlatList
            data={officePreview}
            keyExtractor={(o) => o.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ width: theme.spacing.md }} />}
            renderItem={({ item }) => (
              <ClinicCard
                organization={item}
                width={280}
                onPress={() => router.push(Routes.veterinaryOfficeDetail(item.id))}
              />
            )}
          />
        )}
      </Section>

      {/* Quick links — chat, services, magazine, books. */}
      <Section spacing="xl">
        <Row gap="md" align="stretch">
          <QuickLinkCard
            icon="chatbubbles-outline"
            title={t('home.chat.title')}
            subtitle={t('home.chat.subtitle')}
            ctaLabel={t('home.chat.cta')}
            surfaceColor={theme.colors.primarySoft}
            accentColor="primary"
            onPress={() => router.push(Routes.chat)}
          />
          <QuickLinkCard
            icon="medkit-outline"
            title={t('home.services.title')}
            subtitle={t('home.services.subtitle')}
            ctaLabel={t('home.services.cta')}
            surfaceColor={theme.colors.serviceSurface}
            accentColor="serviceAccent"
            onPress={() => router.push(Routes.vetServices)}
          />
        </Row>
      </Section>

      <Section spacing="giant">
        <Row gap="md" align="stretch">
          <QuickLinkCard
            icon="newspaper-outline"
            title={t('home.magazine.title')}
            subtitle={t('home.magazine.subtitle')}
            surfaceColor={theme.colors.surfaceAccent}
            accentColor="primary"
            onPress={() => router.push(Routes.contentType('magazines'))}
          />
          <QuickLinkCard
            icon="book-outline"
            title={t('home.books.title')}
            subtitle={t('home.books.subtitle')}
            surfaceColor={theme.colors.surfaceAccent}
            accentColor="primary"
            onPress={() => router.push(Routes.contentType('books'))}
          />
        </Row>
      </Section>
    </ScrollScreen>
  );
}
