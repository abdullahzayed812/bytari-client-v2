import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, IconButton } from '@/components/actions';
import { Badge, Card, Icon, type IconName } from '@/components/content';
import { ConfirmationDialog, EmptyState, Loading, useToast } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { AnnouncementCard } from '../components';
import {
  useDeleteSyndicate,
  useFollowSyndicate,
  useMySyndicateAccess,
  useSyndicate,
  useSyndicateAnnouncements,
  useSyndicateRegistration,
  useUnfollowSyndicate,
} from '../hooks';

/** One management tile — optional unread badge + secondary line (e.g. pending count). */
function ManageTile({
  icon,
  label,
  badge,
  hint,
  tone = 'primary',
  onPress,
}: {
  icon: IconName;
  label: string;
  badge?: string | null;
  hint?: string | null;
  tone?: 'primary' | 'danger';
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      padding="md"
      onPress={onPress}
      style={{ width: '48%', rowGap: 6 }}
      accessibilityLabel={label}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Icon name={icon} size="iconMd" color={tone} />
        {badge ? <Badge label={badge} tone="danger" /> : null}
      </View>
      <Text variant="bodyStrong" numberOfLines={2} color={tone === 'danger' ? 'danger' : undefined}>
        {label}
      </Text>
      {hint ? <Caption color="textMuted">{hint}</Caption> : null}
    </Card>
  );
}

const SERVICE_TILES = [
  { key: 'idCard', labelKey: 'home.servicesTiles.idCard', icon: 'card-outline' as const, route: 'idRequirements' as const },
  { key: 'inquiry', labelKey: 'home.servicesTiles.inquiry', icon: 'chatbubble-ellipses-outline' as const, route: 'inquiry' as const },
  { key: 'announcements', labelKey: 'home.servicesTiles.announcements', icon: 'megaphone-outline' as const, route: 'announcements' as const },
  { key: 'registerDoctors', labelKey: 'home.servicesTiles.registerDoctors', icon: 'person-add-outline' as const, route: 'register' as const },
  { key: 'legalSupport', labelKey: 'home.servicesTiles.legalSupport', icon: 'scale-outline' as const, route: 'legalSupport' as const },
  { key: 'officeLicenses', labelKey: 'home.servicesTiles.officeLicenses', icon: 'business-outline' as const, route: 'officeLicenses' as const },
] as const;

/**
 * Route `/(app)/syndicates/[organizationId]` — the syndicate home, main or
 * branch (reference screenshot 1 / screenshot 5 "فرع النقابة - بغداد").
 * Same layout either way — only the data differs.
 */
export default function SyndicateDetailsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();

  const q = useSyndicate(organizationId);
  const announcements = useSyndicateAnnouncements(organizationId);
  const access = useMySyndicateAccess(organizationId);
  const follow = useFollowSyndicate(organizationId ?? '_');
  const unfollow = useUnfollowSyndicate(organizationId ?? '_');
  const registration = useSyndicateRegistration(organizationId ?? '_');
  const deleteSyndicate = useDeleteSyndicate();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const syndicate = q.data;
  const a = access.data;
  const canManageAnything = Boolean(
    a &&
      (a.canReadSubmissions ||
        a.canReadMembers ||
        a.canMessageMembers ||
        a.canManageProfile ||
        a.canManageAnnouncements ||
        a.isOwner ||
        a.isAdmin),
  );

  const onRegister = (): void => {
    if (syndicate?.isRegistered) {
      setConfirmCancel(true);
      return;
    }
    registration.register.mutate(undefined, {
      onSuccess: () => toast.show({ message: t('registration.registeredSuccess'), tone: 'success' }),
      onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
    });
  };

  const onToggleFollow = (): void => {
    const mutation = syndicate?.isFollowing ? unfollow : follow;
    mutation.mutate(undefined, { onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }) });
  };

  const onServiceTile = (route: (typeof SERVICE_TILES)[number]['route']): void => {
    if (!organizationId) return;
    switch (route) {
      case 'idRequirements':
        router.push(Routes.syndicateIdRequirements);
        return;
      case 'inquiry':
        router.push(Routes.syndicateInquiry(organizationId));
        return;
      case 'announcements':
        router.push(Routes.syndicateAnnouncements(organizationId));
        return;
      case 'legalSupport':
        router.push(Routes.syndicateLegalSupport);
        return;
      case 'officeLicenses':
        router.push(Routes.syndicateOfficeLicenses);
        return;
      case 'register':
        onRegister();
    }
  };

  if (q.isLoading) {
    return (
      <SafeAreaScreen>
        <AppHeader title="" showBack />
        <Loading fill />
      </SafeAreaScreen>
    );
  }
  if (q.isError || !syndicate) {
    return (
      <SafeAreaScreen>
        <AppHeader title="" showBack />
        <EmptyState icon="people-outline" title={t('home.notFound')} />
      </SafeAreaScreen>
    );
  }

  return (
    <SafeAreaScreen>
      <AppHeader
        title={syndicate.name}
        showBack
        right={
          <IconButton
            icon="document-text-outline"
            variant="soft"
            accessibilityLabel={t('mySubmissions.title')}
            onPress={() => router.push(Routes.syndicateMy)}
          />
        }
      />
      <ScrollView contentContainerStyle={{ padding: theme.screenPadding, rowGap: theme.spacing.lg, paddingBottom: theme.spacing.huge }}>
        <Card variant="elevated" padding="lg">
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
            <View style={{ flex: 1, rowGap: theme.spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
                {syndicate.status === 'ACTIVE' ? (
                  <Icon name="checkmark-circle" size="iconSm" color="success" />
                ) : null}
                <Text variant="bodyStrong" numberOfLines={2} style={{ flex: 1 }}>
                  {syndicate.name}
                </Text>
              </View>
              {syndicate.description ? (
                <Caption color="textSecondary" numberOfLines={3}>
                  {syndicate.description}
                </Caption>
              ) : null}
              <Caption color="textMuted">
                {t('registration.membersCount', { count: syndicate.membersCount })}
              </Caption>
              {syndicate.isRegistered ? (
                <View style={{ rowGap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
                    <Icon name="checkmark-done-outline" size="iconSm" color="success" />
                    <Caption color="success">{t('registration.registered')}</Caption>
                  </View>
                  <Button
                    label={t('registration.cancelCta')}
                    variant="outline"
                    size="sm"
                    disabled={registration.cancel.isPending}
                    onPress={onRegister}
                  />
                </View>
              ) : (
                <Button
                  label={t('registration.registerCta')}
                  leftIcon="person-add-outline"
                  size="sm"
                  loading={registration.register.isPending}
                  disabled={registration.register.isPending}
                  onPress={onRegister}
                />
              )}
            </View>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: theme.radius.lg,
                backgroundColor: theme.colors.surfaceAccent,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {syndicate.logoUrl ? (
                <Image source={{ uri: syndicate.logoUrl }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Icon name="shield-checkmark-outline" size="iconLg" color="primary" />
              )}
            </View>
          </View>
        </Card>

        <View style={{ rowGap: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="bodyStrong">{t('home.announcements')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
              <IconButton
                icon={syndicate.isFollowing ? 'heart' : 'heart-outline'}
                variant="soft"
                accessibilityLabel={t('home.register')}
                disabled={follow.isPending || unfollow.isPending}
                onPress={onToggleFollow}
              />
              <Button
                label={t('home.viewAll')}
                variant="ghost"
                size="sm"
                onPress={() => router.push(Routes.syndicateAnnouncements(syndicate.id))}
              />
            </View>
          </View>
          {announcements.isLoading ? (
            <Loading />
          ) : announcements.announcements.length === 0 ? (
            <EmptyState icon="megaphone-outline" title={t('announcements.empty')} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ columnGap: theme.spacing.md }}>
              {announcements.announcements.slice(0, 5).map((a) => (
                <AnnouncementCard
                  key={a.id}
                  announcement={a}
                  width={260}
                  onPress={() => router.push(Routes.syndicateAnnouncementDetails(a.id))}
                />
              ))}
            </ScrollView>
          )}
        </View>

        <View style={{ rowGap: theme.spacing.sm }}>
          <Text variant="bodyStrong">{t('home.services')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {SERVICE_TILES.map((tile) => (
              <Card
                key={tile.key}
                variant="outlined"
                padding="md"
                onPress={() => onServiceTile(tile.route)}
                style={{ width: '31%', alignItems: 'center', rowGap: 6 }}
              >
                <Icon name={tile.icon} size="iconMd" color="primary" />
                <Caption style={{ textAlign: 'center' }} numberOfLines={2}>
                  {t(tile.labelKey)}
                </Caption>
              </Card>
            ))}
          </View>
        </View>

        {syndicate.branchCount > 0 ? (
          <Card
            variant="outlined"
            padding="md"
            onPress={() => router.push(Routes.syndicateBranches(syndicate.id))}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
              <Icon name="business-outline" size="iconLg" color="primary" />
              <View style={{ flex: 1, rowGap: 4 }}>
                <Text variant="bodyStrong">{t('home.branchesCardTitle')}</Text>
                <Caption color="textSecondary">{t('home.branchesCardSubtitle')}</Caption>
              </View>
              <Icon name="chevron-back" directional size="iconSm" color="textMuted" />
            </View>
          </Card>
        ) : null}

        <View style={{ rowGap: theme.spacing.sm }}>
          <Text variant="bodyStrong">{t('home.contactInfo')}</Text>
          <Card variant="outlined" padding="md" style={{ rowGap: theme.spacing.sm }}>
            {syndicate.phone ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
                <Icon name="call-outline" size="iconSm" color="primary" />
                <Text variant="body">{syndicate.phone}</Text>
              </View>
            ) : null}
            {syndicate.email ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
                <Icon name="mail-outline" size="iconSm" color="primary" />
                <Text variant="body">{syndicate.email}</Text>
              </View>
            ) : null}
            {syndicate.website ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
                <Icon name="globe-outline" size="iconSm" color="primary" />
                <Text variant="body">{syndicate.website}</Text>
              </View>
            ) : null}
            {syndicate.address ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
                <Icon name="location-outline" size="iconSm" color="primary" />
                <Text variant="body" style={{ flex: 1 }}>
                  {syndicate.address}
                </Text>
              </View>
            ) : null}
          </Card>
        </View>

        {canManageAnything && a ? (
          <View style={{ rowGap: theme.spacing.sm }}>
            <Text variant="bodyStrong">{t('manage.title')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {a.canReadSubmissions ? (
                <>
                  <ManageTile
                    icon="document-text-outline"
                    label={t('manage.requests')}
                    badge={
                      syndicate.counters?.unreadRequests
                        ? t('manage.newCount', { count: syndicate.counters.unreadRequests })
                        : null
                    }
                    hint={t('manage.pendingCount', { count: syndicate.counters?.pendingRequests ?? 0 })}
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/syndicates/[organizationId]/submissions',
                        params: { organizationId: syndicate.id, kind: 'REQUEST' },
                      })
                    }
                  />
                  <ManageTile
                    icon="chatbubbles-outline"
                    label={t('manage.inquiries')}
                    badge={
                      syndicate.counters?.unreadInquiries
                        ? t('manage.newCount', { count: syndicate.counters.unreadInquiries })
                        : null
                    }
                    hint={t('manage.pendingCount', { count: syndicate.counters?.pendingInquiries ?? 0 })}
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/syndicates/[organizationId]/submissions',
                        params: { organizationId: syndicate.id, kind: 'INQUIRY' },
                      })
                    }
                  />
                </>
              ) : null}
              {a.canReadMembers ? (
                <ManageTile
                  icon="people-outline"
                  label={t('manage.members')}
                  hint={t('registration.membersCount', { count: syndicate.membersCount })}
                  onPress={() => router.push(Routes.syndicateMembers(syndicate.id))}
                />
              ) : null}
              {a.canMessageMembers ? (
                <ManageTile
                  icon="send-outline"
                  label={t('manage.messageMembers')}
                  onPress={() => router.push(Routes.syndicateMembersBroadcast(syndicate.id))}
                />
              ) : null}
              {a.canManageAnnouncements ? (
                <ManageTile
                  icon="megaphone-outline"
                  label={t('announcements.addAnnouncement')}
                  onPress={() => router.push(Routes.syndicateAnnouncementNew(syndicate.id))}
                />
              ) : null}
              {a.canManageProfile ? (
                <ManageTile
                  icon="create-outline"
                  label={t('manage.edit')}
                  onPress={() => router.push(Routes.syndicateEdit(syndicate.id))}
                />
              ) : null}
              {a.isOwner || a.isAdmin ? (
                <>
                  <ManageTile
                    icon="shield-outline"
                    label={t('manage.admins')}
                    onPress={() => router.push(Routes.organizationSupervisors(syndicate.id))}
                  />
                  <ManageTile
                    icon="person-add-outline"
                    label={t('manage.addAdmin')}
                    onPress={() => router.push(Routes.syndicateAdminNew(syndicate.id))}
                  />
                </>
              ) : null}
              {a.canDelete ? (
                <ManageTile
                  icon="trash-outline"
                  label={t('manage.delete')}
                  tone="danger"
                  onPress={() => setConfirmDelete(true)}
                />
              ) : null}
            </View>
          </View>
        ) : null}

        {syndicate.headOfficerName ? (
          <View style={{ rowGap: theme.spacing.sm }}>
            <Text variant="bodyStrong">{t('home.details')}</Text>
            <Card variant="outlined" padding="md">
              <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
                <Icon name="person-circle-outline" size="iconMd" color="primary" />
                <View style={{ flex: 1, rowGap: 2 }}>
                  <Caption color="textMuted">{t('home.headOfficerLabel')}</Caption>
                  <Text variant="bodyStrong">{syndicate.headOfficerName}</Text>
                  {syndicate.headOfficerTitle ? <Caption>{syndicate.headOfficerTitle}</Caption> : null}
                  {syndicate.termStartYear && syndicate.termEndYear ? (
                    <Caption color="textMuted">
                      {t('home.termLabel', { start: syndicate.termStartYear, end: syndicate.termEndYear })}
                    </Caption>
                  ) : null}
                </View>
              </View>
            </Card>
          </View>
        ) : null}
      </ScrollView>
      <ConfirmationDialog
        visible={confirmCancel}
        title={t('registration.cancelConfirmTitle')}
        message={t('registration.cancelConfirmBody')}
        destructive
        loading={registration.cancel.isPending}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() =>
          registration.cancel.mutate(undefined, {
            onSuccess: () => {
              setConfirmCancel(false);
              toast.show({ message: t('registration.cancelledSuccess'), tone: 'success' });
            },
            onError: (e) => {
              setConfirmCancel(false);
              toast.show({ message: apiErrorMessage(e), tone: 'danger' });
            },
          })
        }
      />
      <ConfirmationDialog
        visible={confirmDelete}
        title={t('manage.deleteConfirmTitle')}
        message={t('manage.deleteConfirmBody')}
        destructive
        loading={deleteSyndicate.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          deleteSyndicate.mutate(syndicate.id, {
            onSuccess: () => {
              setConfirmDelete(false);
              toast.show({ message: t('manage.deleted'), tone: 'success' });
              router.back();
            },
            onError: (e) => {
              setConfirmDelete(false);
              toast.show({ message: apiErrorMessage(e), tone: 'danger' });
            },
          })
        }
      />
    </SafeAreaScreen>
  );
}
