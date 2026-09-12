import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, IconButton } from '@/components/actions';
import { Card, Icon } from '@/components/content';
import { EmptyState, Loading, useToast } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { AnnouncementCard } from '../components';
import {
  useFollowSyndicate,
  useMySyndicateAccess,
  useSyndicate,
  useSyndicateAnnouncements,
  useUnfollowSyndicate,
} from '../hooks';

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
  const syndicate = q.data;

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
        toast.show({ message: t('home.registerUnavailable'), tone: 'info' });
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
              <Button
                label={t('home.register')}
                leftIcon="person-add-outline"
                size="sm"
                onPress={() => onServiceTile('register')}
              />
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

        {access.data?.canReadSubmissions || access.data?.isOwner || access.data?.isAdmin ? (
          <View style={{ rowGap: theme.spacing.sm }}>
            <Text variant="bodyStrong">{t('management.submissionsTitle')}</Text>
            <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
              {access.data?.canReadSubmissions ? (
                <View style={{ flex: 1 }}>
                  <Button
                    label={t('management.submissionsTitle')}
                    variant="outline"
                    size="sm"
                    leftIcon="chatbubbles-outline"
                    fullWidth
                    onPress={() => router.push(Routes.syndicateSubmissions(syndicate.id))}
                  />
                </View>
              ) : null}
              {access.data?.isOwner || access.data?.isAdmin ? (
                <View style={{ flex: 1 }}>
                  <Button
                    label={t('home.manageSupervisors')}
                    variant="outline"
                    size="sm"
                    leftIcon="people-outline"
                    fullWidth
                    onPress={() => router.push(Routes.organizationSupervisors(syndicate.id))}
                  />
                </View>
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
    </SafeAreaScreen>
  );
}
