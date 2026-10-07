import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card, Icon, type IconName } from '@/components/content';
import { Alert, EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { Row, SafeAreaScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { animalSpeciesIcon } from '@/features/animals/constants';
import { useOrganizationAnimals } from '@/features/animals/hooks';
import type { OrganizationAnimalGrant } from '@/features/animals/types';
import { useConversationUnreadSummary } from '@/features/chat';
import { useOrganization } from '@/features/organizations';
import { ApiError } from '@/services/api';
import { useTheme, type ColorTokens } from '@/theme';

import { useClinicDashboard } from '../hooks';

const RECENT_ANIMALS_COUNT = 5;
const RECENT_CARD_WIDTH = 132;

type Tone = { surface: keyof ColorTokens; accent: keyof ColorTokens };
const TONES = {
  blue: { surface: 'dashboardBlueSurface', accent: 'dashboardBlueAccent' },
  mint: { surface: 'dashboardMintSurface', accent: 'dashboardMintAccent' },
  amber: { surface: 'dashboardAmberSurface', accent: 'dashboardAmberAccent' },
  rose: { surface: 'dashboardRoseSurface', accent: 'dashboardRoseAccent' },
  violet: { surface: 'dashboardVioletSurface', accent: 'dashboardVioletAccent' },
} as const satisfies Record<string, Tone>;

/**
 * Route `/clinic-dashboard/[organizationId]` — "لوحة العيادة", the CLINIC card's
 * destination from `MyVeterinaryOrganizationsScreen`.
 *
 * Migrated from the legacy `bytari` `app/clinic-dashboard.tsx`, rebuilt on the
 * v2 contracts: the header + stats come from `GET /organizations/:id` and the
 * new `GET /organizations/:id/clinic-dashboard/summary` (clinic-scoped counts +
 * the caller's real RBAC permissions — the legacy screen trusted a client-sent
 * `userId`). Every tile links to an existing v2 screen (animals, grant,
 * appointments, conversations, broadcast, members, supervisors, profile) and is
 * shown only when the backend says the caller may use it.
 */
export default function ClinicDashboardHomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('clinicDashboard');
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const org = useOrganization(orgId);
  const summary = useClinicDashboard(orgId);
  const perms = summary.data?.permissions;
  const isActive = org.data?.status === 'ACTIVE';
  const isExpired = org.data?.details.subscriptionStatus === 'EXPIRED';
  const recent = useOrganizationAnimals(orgId, { enabled: Boolean(perms?.canViewAnimals) });
  const unread = useConversationUnreadSummary(orgId, { enabled: Boolean(orgId) && isActive });
  const unreadMessages = unread.data?.unreadMessages ?? 0;

  const error = org.error ?? summary.error;
  // 404/403 → not a member (or no such org); 400 → not a CLINIC. Never echo server detail.
  const denied = error instanceof ApiError && [400, 403, 404].includes(error.status);

  if (denied) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('title')} showBack />
        <EmptyState
          icon="lock-closed-outline"
          title={t('notAvailableTitle')}
          message={t('notAvailableBody')}
          actionLabel={t('backToList')}
          onAction={() => router.back()}
        />
      </SafeAreaScreen>
    );
  }

  const refreshing = org.isRefetching || summary.isRefetching;
  const onRefresh = () => {
    void org.refetch();
    void summary.refetch();
    if (perms?.canViewAnimals) void recent.refetch();
  };

  const go = (path: string) => router.push(path as never);
  const recentAnimals = recent.animals.slice(0, RECENT_ANIMALS_COUNT);
  const pending = summary.data?.appointments?.pendingCount ?? 0;

  return (
    <SafeAreaScreen>
      <AppHeader title={t('title')} showBack />

      {org.isLoading || summary.isLoading ? (
        <Loading fill label={t('loading')} />
      ) : !org.data || !summary.data ? (
        <Section spacing="xl">
          <ErrorState error={error} onRetry={onRefresh} />
        </Section>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: theme.spacing.huge }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
          {/* --- Clinic info card + headline stats --------------------- */}
          <View
            style={{
              margin: theme.screenPadding,
              padding: theme.spacing.lg,
              borderRadius: theme.radius.xl,
              backgroundColor: theme.colors.primarySoft,
            }}
          >
            <Row gap="md" align="center">
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: theme.radius.pill,
                  backgroundColor: theme.colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {(org.data.details.logoUrl ?? org.data.details.galleryUrls?.[0]) ? (
                  <Image
                    source={{
                      uri: (org.data.details.logoUrl ??
                        org.data.details.galleryUrls?.[0]) as string,
                    }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                ) : (
                  <Icon name="medkit" size="iconLg" color="primary" />
                )}
              </View>
              <View style={{ flex: 1, rowGap: 2 }}>
                <Heading level={3} numberOfLines={1}>
                  {org.data.name}
                </Heading>
                {org.data.details.address ? (
                  <Row gap="xs">
                    <Icon name="location-outline" size="iconXs" color="textMuted" />
                    <Caption numberOfLines={1}>{org.data.details.address}</Caption>
                  </Row>
                ) : null}
                {org.data.details.phone ? (
                  <Row gap="xs">
                    <Icon name="call-outline" size="iconXs" color="textMuted" />
                    <Caption numberOfLines={1}>{org.data.details.phone}</Caption>
                  </Row>
                ) : null}
              </View>
            </Row>

            <Row justify="space-around" style={{ marginTop: theme.spacing.lg }}>
              {summary.data.animals ? (
                <Stat
                  value={summary.data.animals.activeCount}
                  label={t('stats.activeAnimals')}
                  color="success"
                />
              ) : null}
              <Stat value={summary.data.followersCount} label={t('stats.followers')} color="info" />
              <Stat
                value={summary.data.rating ?? '—'}
                label={t('stats.rating')}
                color="primary"
                onPress={() => go(Routes.organizationReviews(orgId))}
              />
            </Row>
          </View>

          {!isActive ? (
            <Section spacing="sm">
              <Alert tone="warning" title={t('inactiveTitle')} message={t('inactiveBody')} />
            </Section>
          ) : null}
          {isExpired ? (
            <Section spacing="sm">
              <Alert tone="danger" title={t('expiredTitle')} message={t('expiredBody')} />
              {org.data.myRole === 'OWNER' ? (
                <View style={{ marginTop: theme.spacing.sm }}>
                  <Button
                    label={t('renewCta')}
                    variant="outline"
                    leftIcon="refresh-outline"
                    onPress={() => go(Routes.organizationSubscriptionRenewal(orgId))}
                  />
                </View>
              ) : null}
            </Section>
          ) : null}

          {/* --- Animal search → the clinic's animal list (local name filter) --- */}
          {perms?.canViewAnimals ? (
            <Section spacing="lg">
              <Pressable
                accessibilityRole="search"
                accessibilityLabel={t('search.placeholder')}
                onPress={() => go(Routes.organizationAnimals(orgId))}
              >
                <View pointerEvents="none">
                  <SearchInput
                    value=""
                    onChangeText={() => undefined}
                    editable={false}
                    placeholder={t('search.placeholder')}
                  />
                </View>
              </Pressable>
            </Section>
          ) : null}

          {/* --- Today's stats ------------------------------------- */}
          {summary.data.medical || summary.data.appointments ? (
            <Section spacing="lg">
              <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.md }}>
                {t('today.title')}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
                {summary.data.medical ? (
                  <>
                    <TodayStat
                      icon="medkit-outline"
                      tone={TONES.mint}
                      value={summary.data.medical.medicalRecordsToday}
                      label={t('today.medicalRecords')}
                    />
                    {perms?.canViewVaccinations ? (
                      <TodayStat
                        icon="shield-checkmark-outline"
                        tone={TONES.blue}
                        value={summary.data.medical.vaccinationsDueToday}
                        label={t('today.vaccinationsDue')}
                      />
                    ) : null}
                    <TodayStat
                      icon="person-circle-outline"
                      tone={TONES.rose}
                      value={summary.data.medical.visitorsToday}
                      label={t('today.visitors')}
                    />
                  </>
                ) : null}
                {summary.data.appointments ? (
                  <>
                    <TodayStat
                      icon="calendar-outline"
                      tone={TONES.violet}
                      value={summary.data.appointments.todayCount}
                      label={t('today.appointments')}
                      onPress={() => go(Routes.clinicDashboardAppointments(orgId))}
                    />
                    <TodayStat
                      icon="hourglass-outline"
                      tone={TONES.amber}
                      value={summary.data.appointments.pendingCount}
                      label={t('today.pendingRequests')}
                      onPress={() => go(Routes.clinicDashboardAppointments(orgId))}
                    />
                  </>
                ) : null}
              </View>
            </Section>
          ) : null}

          {/* --- Recent animals ------------------------------------ */}
          {perms?.canViewAnimals ? (
            <Section spacing="lg">
              <Row justify="space-between" align="center">
                <Text variant="bodyStrong">{t('recent.title')}</Text>
                {recentAnimals.length > 0 ? (
                  <Text
                    variant="label"
                    color="primary"
                    onPress={() => go(Routes.organizationAnimals(orgId))}
                  >
                    {t('recent.viewAll')}
                  </Text>
                ) : null}
              </Row>
              {recent.isLoading ? (
                <Loading />
              ) : recentAnimals.length === 0 ? (
                <EmptyState
                  icon="paw-outline"
                  title={t('recent.empty')}
                  message={t('recent.emptyHint')}
                />
              ) : (
                <FlatList
                  data={recentAnimals}
                  keyExtractor={(g) => g.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: theme.spacing.md }}
                  ItemSeparatorComponent={() => <View style={{ width: theme.spacing.md }} />}
                  renderItem={({ item }) => (
                    <RecentAnimalCard
                      grant={item}
                      onPress={() => go(Routes.organizationAnimalDetail(orgId, item.animalId))}
                    />
                  )}
                />
              )}
            </Section>
          ) : null}

          {/* --- Quick access -------------------------------------- */}
          <Section spacing="lg">
            <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.md }}>
              {t('quick.title')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
              {perms?.canViewAnimals ? (
                <QuickTile
                  icon="paw-outline"
                  tone={TONES.amber}
                  label={t('quick.animals')}
                  count={summary.data.animals?.activeCount}
                  onPress={() => go(Routes.organizationAnimals(orgId))}
                />
              ) : null}
              {perms?.canManageAnimalAccess && isActive ? (
                <QuickTile
                  icon="link-outline"
                  tone={TONES.mint}
                  label={t('quick.linkAnimal')}
                  onPress={() => go(Routes.organizationAnimalsGrant(orgId))}
                />
              ) : null}
              {perms?.canViewAppointments ? (
                <QuickTile
                  icon="calendar-outline"
                  tone={TONES.rose}
                  label={t('quick.appointments')}
                  badge={pending}
                  badgeLabel={t('quick.pendingBadge', { count: pending })}
                  onPress={() => go(Routes.clinicDashboardAppointments(orgId))}
                />
              ) : null}
              <QuickTile
                icon="chatbubbles-outline"
                tone={TONES.blue}
                label={t('quick.conversations')}
                badge={unreadMessages}
                badgeLabel={t('quick.unreadBadge', { count: unreadMessages })}
                onPress={() => go(Routes.clinicDashboardConversations(orgId))}
              />
              {perms?.canSendBroadcast && isActive && !isExpired ? (
                <QuickTile
                  icon="paper-plane-outline"
                  tone={TONES.violet}
                  label={t('quick.broadcast')}
                  onPress={() => go(Routes.clinicDashboardBroadcast(orgId))}
                />
              ) : null}
            </View>
          </Section>

          {/* --- Quick settings (management) ----------------------- */}
          <Section spacing="lg">
            <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.md }}>
              {t('settings.title')}
            </Text>
            <View style={{ rowGap: theme.spacing.sm }}>
              {perms?.canViewMembers ? (
                <>
                  <SettingRow
                    icon="people-outline"
                    label={t('settings.members')}
                    onPress={() => go(Routes.organizationMembers(orgId))}
                  />
                  <SettingRow
                    icon="medkit-outline"
                    label={t('settings.veterinarians')}
                    onPress={() =>
                      router.push({
                        pathname: Routes.organizationMembers(orgId) as never,
                        params: { roleKey: 'VETERINARIAN' },
                      })
                    }
                  />
                </>
              ) : null}
              {perms?.canViewSupervisors ? (
                <SettingRow
                  icon="shield-checkmark-outline"
                  label={t('settings.supervisors')}
                  onPress={() => go(Routes.organizationSupervisors(orgId))}
                />
              ) : null}
              {perms?.canEditOrganization ? (
                <SettingRow
                  icon="settings-outline"
                  label={t('settings.editProfile')}
                  onPress={() => go(Routes.organizationEdit(orgId))}
                />
              ) : null}
              <SettingRow
                icon="star-outline"
                label={t('settings.reviews')}
                onPress={() => go(Routes.organizationReviews(orgId))}
              />
              <SettingRow
                icon="business-outline"
                label={t('settings.profile')}
                onPress={() => go(Routes.organizationDetail(orgId))}
              />
            </View>
          </Section>
        </ScrollView>
      )}
    </SafeAreaScreen>
  );
}

function Stat({
  value,
  label,
  color,
  onPress,
}: {
  value: string | number;
  label: string;
  color: 'primary' | 'success' | 'info';
  onPress?: () => void;
}) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{ alignItems: 'center', rowGap: 2 }}
    >
      <Text variant="heading" color={color}>
        {value}
      </Text>
      <Caption>{label}</Caption>
    </Pressable>
  );
}

function TodayStat({
  icon,
  tone,
  value,
  label,
  onPress,
}: {
  icon: IconName;
  tone: Tone;
  value: number;
  label: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [
        {
          flexGrow: 1,
          minWidth: '30%',
          alignItems: 'center',
          rowGap: 4,
          paddingVertical: theme.spacing.md,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors[tone.surface],
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Icon name={icon} size="iconMd" color={tone.accent} />
      <Text variant="title" weight="bold" style={{ color: theme.colors[tone.accent] }}>
        {value}
      </Text>
      <Caption style={{ textAlign: 'center' }}>{label}</Caption>
    </Pressable>
  );
}

function QuickTile({
  icon,
  tone,
  label,
  count,
  badge,
  badgeLabel,
  onPress,
}: {
  icon: IconName;
  tone: Tone;
  label: string;
  /** Neutral total under the label (e.g. number of animals). */
  count?: number;
  /** Red counter on the icon (unread / pending); hidden at 0. */
  badge?: number;
  badgeLabel?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const n = badge ?? 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={n > 0 && badgeLabel ? `${label}، ${badgeLabel}` : label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexGrow: 1,
          minWidth: '45%',
          alignItems: 'center',
          rowGap: theme.spacing.sm,
          paddingVertical: theme.spacing.lg,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors[tone.surface],
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View>
        <Icon name={icon} size="iconLg" color={tone.accent} />
        {n > 0 ? (
          <View style={{ position: 'absolute', top: -6, insetInlineEnd: -12 }}>
            <Badge label={n > 99 ? '99+' : String(n)} tone="danger" size="sm" />
          </View>
        ) : null}
      </View>
      <Text variant="label" style={{ textAlign: 'center' }}>
        {label}
      </Text>
      {count !== undefined ? <Caption>{count}</Caption> : null}
    </Pressable>
  );
}

function SettingRow({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Card variant="outlined" padding="md" onPress={onPress} accessibilityLabel={label}>
      <Row gap="md">
        <Icon name={icon} size="iconMd" color="primary" />
        <Text variant="bodyMedium" style={{ flex: 1 }}>
          {label}
        </Text>
        <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
      </Row>
    </Card>
  );
}

function RecentAnimalCard({
  grant,
  onPress,
}: {
  grant: OrganizationAnimalGrant;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('orgAnimals');
  return (
    <Card
      variant="outlined"
      padding="md"
      onPress={onPress}
      accessibilityLabel={t('card.open', { name: grant.animal.name })}
      style={{ width: RECENT_CARD_WIDTH }}
    >
      <View style={{ alignItems: 'center', rowGap: theme.spacing.xs }}>
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
          <Icon name={animalSpeciesIcon(grant.animal.species)} size="iconMd" color="primary" />
        </View>
        <Text variant="bodyStrong" numberOfLines={1}>
          {grant.animal.name}
        </Text>
        <Caption numberOfLines={1}>
          {t(`species.${grant.animal.species}`, { defaultValue: grant.animal.species })}
        </Caption>
      </View>
    </Card>
  );
}
