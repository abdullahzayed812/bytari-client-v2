import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, View } from 'react-native';

import { Button, IconButton } from '@/components/actions';
import { Card, Chip, Divider, Icon, type IconName } from '@/components/content';
import { ErrorState, Loading, useToast } from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { Heading, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useStartConversation } from '@/features/chat';
import { apiErrorMessage } from '@/lib/apiError';
import { mapsUrl } from '@/lib/maps';
import { shareText } from '@/lib/share';
import { useTheme } from '@/theme';

import { ImageCarousel, RatingStars, ReviewModal } from '../components';
import { useFollowOrganization, usePublicOrganization, useUnfollowOrganization } from '../hooks';

interface InfoRowProps {
  icon: IconName;
  label: string;
  value: string;
  onPress?: () => void;
}

/** One "معلومات العيادة" row — label + icon on the trailing side, value leading. */
function InfoRow({ icon, label, value, onPress }: InfoRowProps) {
  return (
    <Row justify="space-between" align="flex-start" gap="lg">
      <Row gap="xs" style={{ flexShrink: 0 }}>
        <Icon name={icon} size="iconSm" color="primary" />
        <Text variant="label" color="textSecondary">
          {label}
        </Text>
      </Row>
      {onPress ? (
        <Pressable onPress={onPress} style={{ flexShrink: 1 }} hitSlop={4}>
          <Text color="primary" style={{ textAlign: 'left' }}>
            {value}
          </Text>
        </Pressable>
      ) : (
        <Text style={{ flex: 1, textAlign: 'left' }}>{value}</Text>
      )}
    </Row>
  );
}

interface ContactRowProps {
  icon: IconName;
  value: string;
  onPress: () => void;
  accessibilityLabel: string;
}

function ContactRow({ icon, value, onPress, accessibilityLabel }: ContactRowProps) {
  return (
    <Row justify="space-between">
      <Text style={{ flex: 1 }}>{value}</Text>
      <IconButton
        icon={icon}
        variant="filled"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
      />
    </Row>
  );
}

/** A publicly-discoverable clinic's profile — no membership required. */
export default function ClinicDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation('organizations');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const q = usePublicOrganization(organizationId);
  const follow = useFollowOrganization(organizationId ?? '');
  const unfollow = useUnfollowOrganization(organizationId ?? '');
  const startConversation = useStartConversation();
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  if (q.isLoading) {
    return (
      <ScrollScreen padded={false}>
        <Loading fill />
      </ScrollScreen>
    );
  }
  if (q.isError || !q.data) {
    return (
      <ScrollScreen>
        <ErrorState
          error={q.error}
          title={t('discover.notFound')}
          onRetry={() => void q.refetch()}
        />
      </ScrollScreen>
    );
  }

  const org = q.data;
  const doctorNames = org.veterinarians.map((v) =>
    t('clinicDetail.doctorPrefix', { name: `${v.firstName} ${v.lastName}` }),
  );

  const toggleFollow = () => {
    const action = org.engagement.isFollowing ? unfollow : follow;
    action.mutate(undefined, {
      onError: (error) => toast.show({ message: apiErrorMessage(error), tone: 'danger' }),
    });
  };

  const onShare = () => {
    void shareText(org.name + (org.address ? `\n${org.address}` : '')).then((outcome) => {
      if (outcome === 'copied') toast.show({ message: tc('share.copied'), tone: 'success' });
      else if (outcome === 'unavailable')
        toast.show({ message: tc('share.unavailable'), tone: 'info' });
    });
  };

  const onDirectContact = () => {
    startConversation.mutate(
      { organizationId: org.id },
      {
        onSuccess: (conversation) => router.push(Routes.chatThread(conversation.id)),
        onError: (error) => toast.show({ message: apiErrorMessage(error), tone: 'danger' }),
      },
    );
  };

  const onBookAppointment = () => {
    router.push(Routes.clinicBookAppointment(org.id));
  };

  const socialLinks: { icon: IconName; url: string; label: string }[] = [
    ...(org.instagramUrl
      ? [{ icon: 'logo-instagram' as IconName, url: org.instagramUrl, label: 'Instagram' }]
      : []),
    ...(org.facebookUrl
      ? [{ icon: 'logo-facebook' as IconName, url: org.facebookUrl, label: 'Facebook' }]
      : []),
    ...(org.tiktokUrl
      ? [{ icon: 'logo-tiktok' as IconName, url: org.tiktokUrl, label: 'TikTok' }]
      : []),
  ];

  const hasContact = Boolean(
    org.phone || org.whatsapp || org.email || org.address || socialLinks.length > 0,
  );

  return (
    <ScrollScreen padded={false}>
      <ImageCarousel images={org.galleryUrls ?? []} />

      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.lg }}>
        <Section>
          <Card padding="lg">
            <Row justify="space-between" align="flex-start">
              <Row gap="xs">
                <Text variant="bodyStrong">{t('clinicDetail.infoTitle')}</Text>
                <Icon name="business-outline" size="iconSm" color="primary" />
              </Row>
              <Row gap="sm" wrap>
                <Chip
                  label={
                    org.engagement.isFollowing
                      ? t('clinicDetail.following')
                      : t('clinicDetail.follow')
                  }
                  icon={org.engagement.isFollowing ? 'checkmark' : 'add'}
                  selected={org.engagement.isFollowing}
                  disabled={follow.isPending || unfollow.isPending}
                  onPress={toggleFollow}
                />
                <IconButton
                  icon="share-social-outline"
                  variant="soft"
                  accessibilityLabel={t('clinicDetail.shareA11y')}
                  onPress={onShare}
                />
                <View
                  accessible
                  accessibilityLabel={t('clinicDetail.verifiedBadge')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    columnGap: theme.spacing.xs,
                    paddingHorizontal: theme.spacing.lg,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.radius.pill,
                    borderWidth: 1.5,
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.primarySoft,
                  }}
                >
                  <Icon name="shield-checkmark" size="iconXs" color="primary" />
                  <Text variant="label" color="primary">
                    {t('clinicDetail.verifiedBadge')}
                  </Text>
                </View>
              </Row>
            </Row>

            <Heading level={2} style={{ marginTop: theme.spacing.lg }}>
              {org.name}
            </Heading>

            <View style={{ marginTop: theme.spacing.xl, rowGap: theme.spacing.md }}>
              {org.description ? (
                <>
                  <InfoRow
                    icon="paw-outline"
                    label={t('clinicDetail.specialty')}
                    value={org.description}
                  />
                  <Divider spacing="md" />
                </>
              ) : null}
              {org.address ? (
                <>
                  <InfoRow
                    icon="location-outline"
                    label={t('clinicDetail.location')}
                    value={org.address}
                    onPress={() =>
                      void Linking.openURL(
                        mapsUrl(org.address as string, org.latitude, org.longitude),
                      )
                    }
                  />
                  <Divider spacing="md" />
                </>
              ) : null}
              {org.workingHours ? (
                <>
                  <InfoRow
                    icon="time-outline"
                    label={t('clinicDetail.workingHours')}
                    value={org.workingHours}
                  />
                  <Divider spacing="md" />
                </>
              ) : null}
              {doctorNames.length > 0 ? (
                <>
                  <InfoRow
                    icon="person-outline"
                    label={t('clinicDetail.doctors')}
                    value={doctorNames.join('، ')}
                  />
                  <Divider spacing="md" />
                </>
              ) : null}
              {org.services && org.services.length > 0 ? (
                <InfoRow
                  icon="medkit-outline"
                  label={t('clinicDetail.services')}
                  value={org.services.join('، ')}
                />
              ) : null}
            </View>
          </Card>
        </Section>

        <Section>
          <Card padding="lg">
            <Row gap="xs">
              <Text variant="bodyStrong">{t('clinicDetail.ratingsTitle')}</Text>
              <Icon name="star" size="iconSm" color="primary" />
            </Row>

            <Row justify="space-between" style={{ marginTop: theme.spacing.lg }}>
              <View style={{ alignItems: 'center', rowGap: 2 }}>
                <Row gap="xs">
                  <Text variant="bodyStrong">{org.engagement.followersCount}</Text>
                  <Icon name="heart" size="iconSm" color="danger" />
                </Row>
                <Text variant="caption" color="textSecondary">
                  {t('clinicDetail.likes')}
                </Text>
              </View>

              <View
                style={{ width: theme.sizes.hairline, backgroundColor: theme.colors.divider }}
              />

              <View style={{ alignItems: 'center', rowGap: 2 }}>
                {org.engagement.rating != null ? (
                  <>
                    <Row gap="xs">
                      <Text variant="bodyStrong">{org.engagement.rating}</Text>
                      <RatingStars value={org.engagement.rating} size="sm" />
                    </Row>
                    <Text variant="caption" color="textSecondary">
                      {t('clinicDetail.reviewsCount', { count: org.engagement.reviewsCount })}
                    </Text>
                  </>
                ) : (
                  <Text variant="caption" color="textSecondary">
                    {t('clinicDetail.noRatingsYet')}
                  </Text>
                )}
              </View>

              <Button
                label={t('clinicDetail.rateCta')}
                variant="outline"
                size="sm"
                onPress={() => setReviewModalVisible(true)}
              />
            </Row>
          </Card>
        </Section>

        {hasContact ? (
          <Section>
            <Card padding="lg">
              <Row gap="xs">
                <Text variant="bodyStrong">{t('clinicDetail.contactTitle')}</Text>
                <Icon name="headset-outline" size="iconSm" color="primary" />
              </Row>

              <View style={{ marginTop: theme.spacing.lg, rowGap: theme.spacing.lg }}>
                {org.phone ? (
                  <ContactRow
                    icon="call"
                    value={org.phone}
                    accessibilityLabel={t('clinicDetail.callA11y', { phone: org.phone })}
                    onPress={() => void Linking.openURL(`tel:${org.phone}`)}
                  />
                ) : null}
                {org.whatsapp ? (
                  <ContactRow
                    icon="logo-whatsapp"
                    value={org.whatsapp}
                    accessibilityLabel={t('clinicDetail.whatsappA11y', { phone: org.whatsapp })}
                    onPress={() =>
                      void Linking.openURL(`https://wa.me/${org.whatsapp?.replace(/\D/g, '')}`)
                    }
                  />
                ) : null}
                {org.email ? (
                  <ContactRow
                    icon="mail"
                    value={org.email}
                    accessibilityLabel={t('clinicDetail.emailA11y', { email: org.email })}
                    onPress={() => void Linking.openURL(`mailto:${org.email}`)}
                  />
                ) : null}
                {org.address ? (
                  <ContactRow
                    icon="location"
                    value={org.address}
                    accessibilityLabel={t('clinicDetail.locationA11y')}
                    onPress={() =>
                      void Linking.openURL(
                        mapsUrl(org.address as string, org.latitude, org.longitude),
                      )
                    }
                  />
                ) : null}
              </View>

              {socialLinks.length > 0 ? (
                <Row gap="md" style={{ marginTop: theme.spacing.lg }}>
                  {socialLinks.map((s) => (
                    <IconButton
                      key={s.label}
                      icon={s.icon}
                      variant="soft"
                      accessibilityLabel={s.label}
                      onPress={() => void Linking.openURL(s.url)}
                    />
                  ))}
                </Row>
              ) : null}
            </Card>
          </Section>
        ) : null}

        <Section>
          <Row gap="md">
            <Button
              label={t('clinicDetail.bookAppointment')}
              variant="outline"
              leftIcon="calendar-outline"
              onPress={onBookAppointment}
              fullWidth
            />
            <Button
              label={t('clinicDetail.directContact')}
              variant="outline"
              leftIcon="chatbubble-ellipses-outline"
              loading={startConversation.isPending}
              onPress={onDirectContact}
              fullWidth
            />
          </Row>
        </Section>

        {org.phone ? (
          <Section>
            <Button
              label={t('clinicDetail.call')}
              leftIcon="call"
              fullWidth
              onPress={() => void Linking.openURL(`tel:${org.phone}`)}
            />
          </Section>
        ) : null}
      </View>

      <ReviewModal
        organizationId={org.id}
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
      />
    </ScrollScreen>
  );
}
