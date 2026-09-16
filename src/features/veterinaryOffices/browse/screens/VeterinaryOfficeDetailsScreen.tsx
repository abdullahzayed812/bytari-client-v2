import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Linking, Pressable, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Icon, type IconName } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { Caption, Heading, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useStartConversation } from '@/features/chat';
import {
  ImageCarousel,
  RatingStars,
  ReviewModal,
  useFollowOrganization,
  usePublicOrganization,
  useUnfollowOrganization,
} from '@/features/organizations';
import { apiErrorMessage } from '@/lib/apiError';
import { mapsUrl } from '@/lib/maps';
import { shareText } from '@/lib/share';
import { useTheme } from '@/theme';

import { PublicVeterinaryOfficeProductCard } from '../components';
import { usePublicVeterinaryOfficeProducts } from '../hooks';

const PRODUCT_PREVIEW_COUNT = 6;
const PRODUCT_CARD_WIDTH = 150;

interface InfoRowProps {
  icon: IconName;
  label: string;
  value: string;
  onPress?: () => void;
}

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

interface ActionButtonProps {
  icon: IconName;
  label: string;
  tone?: 'default' | 'danger';
  onPress: () => void;
}

/** One "اتصال / واتساب / اتجاهات / إعجاب / مشاركة" column — icon + label underneath. */
function ActionButton({ icon, label, tone, onPress }: ActionButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        { alignItems: 'center', rowGap: 4, flex: 1 },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size="iconMd" color={tone === 'danger' ? 'danger' : 'primary'} />
      </View>
      <Caption numberOfLines={1}>{label}</Caption>
    </Pressable>
  );
}

/** A publicly-discoverable veterinary office's profile — no membership required. */
export default function VeterinaryOfficeDetailsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation('veterinaryOffices');
  const { t: torg } = useTranslation('organizations');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const { officeId } = useLocalSearchParams<{ officeId: string }>();
  const q = usePublicOrganization(officeId);
  const follow = useFollowOrganization(officeId ?? '');
  const unfollow = useUnfollowOrganization(officeId ?? '');
  const startConversation = useStartConversation();
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  const products = usePublicVeterinaryOfficeProducts(officeId, { pageSize: PRODUCT_PREVIEW_COUNT });
  const productPreview = products.products.slice(0, PRODUCT_PREVIEW_COUNT);

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
        <ErrorState error={q.error} title={t('detail.notFound')} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }

  const org = q.data;

  const toggleFollow = () => {
    const action = org.engagement.isFollowing ? unfollow : follow;
    action.mutate(undefined, {
      onError: (error) => toast.show({ message: apiErrorMessage(error), tone: 'danger' }),
    });
  };

  const onShare = () => {
    void shareText(org.name + (org.address ? `\n${org.address}` : '')).then((outcome) => {
      if (outcome === 'copied') toast.show({ message: tc('share.copied'), tone: 'success' });
      else if (outcome === 'unavailable') toast.show({ message: tc('share.unavailable'), tone: 'info' });
    });
  };

  const onCall = () => {
    if (org.phone) void Linking.openURL(`tel:${org.phone}`);
  };
  const onWhatsapp = () => {
    if (org.whatsapp) void Linking.openURL(`https://wa.me/${org.whatsapp.replace(/\D/g, '')}`);
  };
  const onDirections = () => {
    if (org.address) void Linking.openURL(mapsUrl(org.address, org.latitude, org.longitude));
  };
  const onMessage = () => {
    startConversation.mutate(
      { organizationId: org.id },
      {
        onSuccess: (conversation) => router.push(Routes.chatThread(conversation.id)),
        onError: (error) => toast.show({ message: apiErrorMessage(error), tone: 'danger' }),
      },
    );
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

  return (
    <ScrollScreen padded={false}>
      <ImageCarousel images={org.galleryUrls ?? []} />

      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.lg }}>
        <Section>
          <Row gap="xs">
            <Icon name="shield-checkmark" size="iconSm" color="primary" />
            <Heading level={2} style={{ flexShrink: 1 }}>
              {org.name}
            </Heading>
          </Row>

          {org.engagement.rating != null ? (
            <Row gap="xs" style={{ marginTop: theme.spacing.sm }}>
              <Text variant="bodyStrong">{org.engagement.rating}</Text>
              <RatingStars value={org.engagement.rating} size="sm" />
              <Caption>{torg('clinicDetail.reviewsCount', { count: org.engagement.reviewsCount })}</Caption>
            </Row>
          ) : null}

          {org.address ? (
            <Row gap="xs" style={{ marginTop: theme.spacing.sm }}>
              <Icon name="location-outline" size="iconSm" color="textMuted" />
              <Caption style={{ flexShrink: 1 }}>{org.address}</Caption>
            </Row>
          ) : null}

          {org.phone ? (
            <Row gap="xs" style={{ marginTop: theme.spacing.xs }}>
              <Icon name="call-outline" size="iconSm" color="textMuted" />
              <Caption>{org.phone}</Caption>
            </Row>
          ) : null}

          <Row style={{ marginTop: theme.spacing.lg }}>
            {org.phone ? (
              <ActionButton icon="call" label={t('detail.call')} onPress={onCall} />
            ) : null}
            {org.whatsapp ? (
              <ActionButton icon="logo-whatsapp" label={t('detail.whatsapp')} onPress={onWhatsapp} />
            ) : null}
            {org.address ? (
              <ActionButton icon="navigate-outline" label={t('detail.directions')} onPress={onDirections} />
            ) : null}
            <ActionButton icon="chatbubble-outline" label={t('detail.message')} onPress={onMessage} />
            <ActionButton
              icon={org.engagement.isFollowing ? 'heart' : 'heart-outline'}
              label={org.engagement.isFollowing ? torg('clinicDetail.following') : t('detail.like')}
              tone={org.engagement.isFollowing ? 'danger' : 'default'}
              onPress={toggleFollow}
            />
            <ActionButton icon="share-social-outline" label={t('detail.share')} onPress={onShare} />
          </Row>
        </Section>

        {org.description ? (
          <Section>
            <Card padding="lg">
              <Row gap="xs">
                <Text variant="bodyStrong">{t('detail.aboutTitle')}</Text>
                <Icon name="document-text-outline" size="iconSm" color="primary" />
              </Row>
              <Text style={{ marginTop: theme.spacing.md }}>{org.description}</Text>
            </Card>
          </Section>
        ) : null}

        {org.address || org.workingHours ? (
          <Section>
            <Card padding="lg">
              <Row gap="xs">
                <Text variant="bodyStrong">{t('detail.infoTitle')}</Text>
                <Icon name="information-circle-outline" size="iconSm" color="primary" />
              </Row>
              <View style={{ marginTop: theme.spacing.lg, rowGap: theme.spacing.md }}>
                {org.address ? (
                  <InfoRow
                    icon="location-outline"
                    label={t('detail.address')}
                    value={org.address}
                    onPress={() => void Linking.openURL(mapsUrl(org.address as string, org.latitude, org.longitude))}
                  />
                ) : null}
                {org.workingHours ? (
                  <InfoRow icon="time-outline" label={t('detail.workingHours')} value={org.workingHours} />
                ) : null}
              </View>
            </Card>
          </Section>
        ) : null}

        <Section>
          <Card padding="lg">
            <Row gap="xs">
              <Text variant="bodyStrong">{torg('clinicDetail.ratingsTitle')}</Text>
              <Icon name="star" size="iconSm" color="primary" />
            </Row>
            <Row justify="space-between" style={{ marginTop: theme.spacing.lg }}>
              <View style={{ alignItems: 'center', rowGap: 2 }}>
                <Row gap="xs">
                  <Text variant="bodyStrong">{org.engagement.followersCount}</Text>
                  <Icon name="heart" size="iconSm" color="danger" />
                </Row>
                <Text variant="caption" color="textSecondary">
                  {torg('clinicDetail.likes')}
                </Text>
              </View>
              <View style={{ width: theme.sizes.hairline, backgroundColor: theme.colors.divider }} />
              <View style={{ alignItems: 'center', rowGap: 2 }}>
                {org.engagement.rating != null ? (
                  <>
                    <Row gap="xs">
                      <Text variant="bodyStrong">{org.engagement.rating}</Text>
                      <RatingStars value={org.engagement.rating} size="sm" />
                    </Row>
                    <Text variant="caption" color="textSecondary">
                      {torg('clinicDetail.reviewsCount', { count: org.engagement.reviewsCount })}
                    </Text>
                  </>
                ) : (
                  <Text variant="caption" color="textSecondary">
                    {torg('clinicDetail.noRatingsYet')}
                  </Text>
                )}
              </View>
              <Button
                label={torg('clinicDetail.rateCta')}
                variant="outline"
                size="sm"
                onPress={() => setReviewModalVisible(true)}
              />
            </Row>
          </Card>
        </Section>

        <Section>
          <Row justify="space-between" align="center">
            <Text variant="bodyStrong">{t('detail.productsTitle', { count: products.total })}</Text>
            {productPreview.length > 0 ? (
              <Text
                variant="label"
                color="primary"
                onPress={() => router.push(Routes.veterinaryOfficeProducts(officeId as string))}
              >
                {t('detail.viewAllProducts')}
              </Text>
            ) : null}
          </Row>
          {products.isLoading ? (
            <Loading />
          ) : productPreview.length === 0 ? (
            <EmptyState icon="cube-outline" title={t('detail.noProducts')} />
          ) : (
            <FlatList
              data={productPreview}
              keyExtractor={(p) => p.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: theme.spacing.md }}
              ItemSeparatorComponent={() => <View style={{ width: theme.spacing.md }} />}
              renderItem={({ item }) => (
                <PublicVeterinaryOfficeProductCard
                  product={item}
                  width={PRODUCT_CARD_WIDTH}
                  onPress={() =>
                    router.push(Routes.veterinaryOfficeProductDetail(officeId as string, item.id))
                  }
                />
              )}
            />
          )}
        </Section>

        {socialLinks.length > 0 ? (
          <Section>
            <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.md }}>
              {t('detail.contactUs')}
            </Text>
            <Row gap="lg" justify="center">
              {socialLinks.map((s) => (
                <ActionButton
                  key={s.label}
                  icon={s.icon}
                  label={s.label}
                  onPress={() => void Linking.openURL(s.url)}
                />
              ))}
            </Row>
          </Section>
        ) : null}

        <Section spacing="giant">
          <Row gap="md">
            {org.phone ? (
              <Button label={t('detail.call')} variant="outline" leftIcon="call" onPress={onCall} fullWidth />
            ) : null}
            {org.whatsapp ? (
              <Button
                label={t('detail.directContact')}
                leftIcon="logo-whatsapp"
                onPress={onWhatsapp}
                fullWidth
              />
            ) : null}
          </Row>
        </Section>
      </View>

      <ReviewModal
        organizationId={org.id}
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
      />
    </ScrollScreen>
  );
}
