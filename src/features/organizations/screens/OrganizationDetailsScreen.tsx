import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Badge, Card, Divider, Icon, type IconName } from '@/components/content';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  SkeletonText,
  useToast,
} from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { ImageViewer } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { organizationManagesAnimals } from '@/features/animals/constants';
import { FarmJoinCodeCard, organizationIsFarm } from '@/features/farmShared';
import { organizationOwnsVeterinaryOfficeProducts } from '@/features/veterinaryOffices/constants';
import { organizationOwnsVeterinaryStoreProducts } from '@/features/veterinaryStore/constants';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { OrganizationStatusBadge, OrganizationTypeBadge } from '../components';
import { orgCapabilities } from '../constants';
import { useLeaveOrganization, useOrganization } from '../hooks';
import { LICENSABLE_ORG_TYPES } from '../types';

const SUBSCRIPTION_TONE = { ACTIVE: 'success', NOT_STARTED: 'neutral', EXPIRED: 'danger' } as const;

/** Route `/organizations/[organizationId]` — organization profile + management entry points. */
export default function OrganizationDetailsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const toast = useToast();
  const { isAdmin } = useCapabilities();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const q = useOrganization(organizationId);
  const leave = useLeaveOrganization(organizationId ?? '');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);

  const denied = q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);

  if (denied) {
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
        <EmptyState
          icon="lock-closed-outline"
          title={t('detail.notAvailableTitle')}
          message={t('detail.notAvailableBody')}
          actionLabel={t('detail.backToList')}
          onAction={() => router.replace(Routes.organizations)}
        />
      </ScrollScreen>
    );
  }

  if (q.isError) {
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }

  const org = q.data;
  const caps = orgCapabilities(org?.myRole, isAdmin);
  const isFarm = organizationIsFarm(org?.type);
  const isVeterinaryStore = organizationOwnsVeterinaryStoreProducts(org?.type);
  const isVeterinaryOffice = organizationOwnsVeterinaryOfficeProducts(org?.type);
  const managesAnimals = organizationManagesAnimals(org?.type);

  return (
    <ScrollScreen>
      <AppHeader title={t('detail.title')} showBack />

      {q.isLoading || !org ? (
        <Section spacing="xl">
          <SkeletonText lines={2} />
          <View style={{ marginTop: theme.spacing.xl }}>
            <SkeletonText lines={5} />
          </View>
        </Section>
      ) : (
        <>
          <Section spacing="xl">
            <Row gap="lg" align="center">
              {org.details.logoUrl ?? org.details.galleryUrls?.[0] ? (
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: theme.radius.pill,
                    overflow: 'hidden',
                    backgroundColor: theme.colors.surfaceAccent,
                  }}
                >
                  <Image
                    source={{ uri: (org.details.logoUrl ?? org.details.galleryUrls?.[0]) as string }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                </View>
              ) : null}
              <View style={{ flex: 1 }}>
                <Heading level={2} numberOfLines={2}>
                  {org.name}
                </Heading>
                <Row gap="xs" wrap style={{ marginTop: theme.spacing.sm }}>
                  <OrganizationTypeBadge type={org.type} size="md" />
                  <OrganizationStatusBadge status={org.status} size="md" />
                  {org.myRole ? (
                    <Text variant="caption" color="textMuted">
                      {t(`role.${org.myRole}`, { defaultValue: org.myRole })}
                    </Text>
                  ) : null}
                </Row>
              </View>
            </Row>
          </Section>

          {(org.details.galleryUrls?.length ?? 0) > 0 ||
          (LICENSABLE_ORG_TYPES.includes(org.type) &&
            (org.details.licenseDocumentUrls?.length ?? 0) > 0) ? (
            <Section spacing="xl">
              <Label>{t('detail.photosSection')}</Label>
              <View style={{ rowGap: theme.spacing.md }}>
                {org.details.galleryUrls && org.details.galleryUrls.length > 0 ? (
                  <PhotoThumbnailRow
                    images={org.details.galleryUrls}
                    onPress={(index) => setViewer({ images: org.details.galleryUrls ?? [], index })}
                  />
                ) : null}
                {LICENSABLE_ORG_TYPES.includes(org.type) &&
                org.details.licenseDocumentUrls &&
                org.details.licenseDocumentUrls.length > 0 ? (
                  <View style={{ rowGap: theme.spacing.sm }}>
                    <Caption>{t('detail.licenseImagesTitle')}</Caption>
                    <PhotoThumbnailRow
                      images={org.details.licenseDocumentUrls}
                      onPress={(index) =>
                        setViewer({ images: org.details.licenseDocumentUrls ?? [], index })
                      }
                    />
                  </View>
                ) : null}
              </View>
            </Section>
          ) : null}

          {org.status === 'PENDING' ? (
            <Section spacing="xl">
              <Card variant="outlined" padding="md">
                <Row gap="md">
                  <Icon name="time-outline" size="iconMd" color="warning" />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium">{t('detail.pendingTitle')}</Text>
                    <Caption>{t('detail.pendingBody')}</Caption>
                  </View>
                </Row>
              </Card>
            </Section>
          ) : null}

          {org.status === 'REJECTED' && org.decisionReason ? (
            <Section spacing="xl">
              <Card variant="outlined" padding="md">
                <Label>{t('detail.rejectionReason')}</Label>
                <Text variant="body">{org.decisionReason}</Text>
              </Card>
            </Section>
          ) : null}

          <Section spacing="xl">
            <Label>{t('detail.sectionInfo')}</Label>
            <Card variant="outlined">
              <InfoRow label={t('detail.fieldType')} value={t(`type.${org.type}`)} />
              <Divider spacing="sm" />
              <InfoRow label={t('detail.fieldStatus')} value={t(`status.${org.status}`)} />
              {org.description ? (
                <>
                  <Divider spacing="sm" />
                  <View style={{ rowGap: 4 }}>
                    <Caption>{t('detail.fieldDescription')}</Caption>
                    <Text variant="body">{org.description}</Text>
                  </View>
                </>
              ) : null}
            </Card>
          </Section>

          {org.details.subscriptionStatus ? (
            <Section spacing="xl">
              <Label>{t('detail.sectionSubscription')}</Label>
              <Card variant="outlined" padding="md">
                <Row justify="space-between" align="center">
                  <Row gap="xs" align="center">
                    <Icon name="calendar-outline" size="iconMd" color="textMuted" />
                    <Caption>
                      {org.details.subscriptionEndDate
                        ? t('card.subscriptionValidUntil', {
                            date: formatDate(org.details.subscriptionEndDate),
                          })
                        : t('card.subscriptionNotStarted')}
                    </Caption>
                  </Row>
                  <Badge
                    label={t(`subscriptionStatus.${org.details.subscriptionStatus}`)}
                    tone={SUBSCRIPTION_TONE[org.details.subscriptionStatus]}
                    size="sm"
                  />
                </Row>
                {org.myRole === 'OWNER' &&
                (org.details.subscriptionStatus === 'EXPIRED' ||
                  org.details.subscriptionStatus === 'NOT_STARTED') ? (
                  <View style={{ marginTop: theme.spacing.sm }}>
                    <TextButton
                      label={t('renewal.title')}
                      icon="refresh-outline"
                      onPress={() => router.push(Routes.organizationSubscriptionRenewal(org.id))}
                    />
                  </View>
                ) : null}
              </Card>
            </Section>
          ) : null}

          {isFarm && caps.canViewFarmJoinCode ? (
            <Section spacing="xl">
              <FarmJoinCodeCard organizationId={org.id} organizationName={org.name} />
            </Section>
          ) : null}

          <Section spacing="xl">
            <Label>{t('detail.manageSection')}</Label>
            <View style={{ rowGap: theme.spacing.sm }}>
              {managesAnimals && caps.canViewOrganizationAnimals ? (
                <NavRow
                  icon="paw-outline"
                  label={t('detail.animals')}
                  onPress={() => router.push(Routes.organizationAnimals(org.id))}
                />
              ) : null}
              {isFarm && caps.canViewFarmPoultry ? (
                <NavRow
                  icon="egg-outline"
                  label={t('detail.poultry')}
                  onPress={() => router.push(Routes.organizationPoultry(org.id))}
                />
              ) : null}
              {isVeterinaryStore && caps.canViewStoreProducts ? (
                <NavRow
                  icon="storefront-outline"
                  label={t('detail.products')}
                  onPress={() => router.push(Routes.organizationStoreProducts(org.id))}
                />
              ) : null}
              {isVeterinaryOffice && caps.canViewStoreProducts ? (
                <NavRow
                  icon="storefront-outline"
                  label={t('detail.products')}
                  onPress={() => router.push(Routes.organizationOfficeProducts(org.id))}
                />
              ) : null}
              {caps.canViewMembers ? (
                <NavRow
                  icon="people-outline"
                  label={t('detail.members')}
                  onPress={() => router.push(Routes.organizationMembers(org.id))}
                />
              ) : null}
              {caps.canViewMembers ? (
                <NavRow
                  icon="medkit-outline"
                  label={t('detail.veterinarians')}
                  onPress={() =>
                    router.push({
                      pathname: Routes.organizationMembers(org.id),
                      params: { roleKey: 'VETERINARIAN' },
                    })
                  }
                />
              ) : null}
              {caps.canViewSupervisors ? (
                <NavRow
                  icon="shield-checkmark-outline"
                  label={t('detail.supervisors')}
                  onPress={() => router.push(Routes.organizationSupervisors(org.id))}
                />
              ) : null}
              {caps.canEditOrganization ? (
                <NavRow
                  icon="create-outline"
                  label={t('detail.editProfile')}
                  onPress={() => router.push(Routes.organizationEdit(org.id))}
                />
              ) : null}
              {!caps.canViewMembers &&
              !caps.canViewSupervisors &&
              !caps.canEditOrganization &&
              !(managesAnimals && caps.canViewOrganizationAnimals) &&
              !(isFarm && caps.canViewFarmPoultry) &&
              !(isVeterinaryStore && caps.canViewStoreProducts) &&
              !(isVeterinaryOffice && caps.canViewStoreProducts) ? (
                <Caption>{t('detail.noManageAccess')}</Caption>
              ) : null}
            </View>
          </Section>

          {caps.canEditOrganization ? (
            <Button
              label={t('detail.editProfile')}
              variant="outline"
              leftIcon="create-outline"
              onPress={() => router.push(Routes.organizationEdit(org.id))}
            />
          ) : null}

          {caps.canLeave ? (
            <View style={{ marginTop: theme.spacing.xl, alignItems: 'center' }}>
              <TextButton
                label={t('detail.leave')}
                tone="danger"
                icon="exit-outline"
                disabled={leave.isPending}
                onPress={() => setConfirmLeave(true)}
              />
            </View>
          ) : null}

          <ConfirmationDialog
            visible={confirmLeave}
            title={t('detail.leaveConfirmTitle')}
            message={t('detail.leaveConfirmBody')}
            confirmLabel={t('detail.leave')}
            cancelLabel={t('common.cancel', { defaultValue: 'إلغاء' })}
            destructive
            loading={leave.isPending}
            onConfirm={() => {
              setConfirmLeave(false);
              leave.mutate(undefined, {
                onSuccess: () => {
                  toast.show({ tone: 'success', message: t('detail.leaveSuccess') });
                  router.replace(Routes.organizations);
                },
                onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
              });
            }}
            onCancel={() => setConfirmLeave(false)}
          />
        </>
      )}

      <ImageViewer
        visible={viewer !== null}
        images={viewer?.images ?? []}
        initialIndex={viewer?.index ?? 0}
        onClose={() => setViewer(null)}
      />
    </ScrollScreen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Row justify="space-between" align="center">
      <Caption>{label}</Caption>
      <Text variant="bodyMedium" numberOfLines={1} style={{ maxWidth: '60%' }}>
        {value}
      </Text>
    </Row>
  );
}

const PHOTO_THUMBNAIL_SIZE = 72;

function PhotoThumbnailRow({
  images,
  onPress,
}: {
  images: string[];
  onPress: (index: number) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
      {images.map((uri, index) => (
        <Pressable
          key={uri}
          accessibilityRole="button"
          accessibilityLabel={`${index + 1}/${images.length}`}
          onPress={() => onPress(index)}
          style={({ pressed }) => [
            {
              width: PHOTO_THUMBNAIL_SIZE,
              height: PHOTO_THUMBNAIL_SIZE,
              borderRadius: theme.radius.md,
              overflow: 'hidden',
              backgroundColor: theme.colors.surfaceAccent,
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        </Pressable>
      ))}
    </View>
  );
}

function NavRow({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
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
