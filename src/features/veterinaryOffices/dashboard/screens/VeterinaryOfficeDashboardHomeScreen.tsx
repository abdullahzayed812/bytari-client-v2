import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, View } from 'react-native';

import { Button } from '@/components/actions';
import { Icon, type IconName } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { Caption, Heading, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useOrganization, useOrganizationSubscriptionRenewals } from '@/features/organizations';
import { useToast } from '@/components/feedback';
import { useTheme } from '@/theme';

import {
  VeterinaryOfficeDashboardShell,
  VeterinaryOfficeProductManageCard,
  VeterinaryOfficeStatusCard,
} from '../components';
import {
  useDeleteVeterinaryOfficeProduct,
  useUpdateVeterinaryOfficeProduct,
  useVeterinaryOfficeProducts,
  useVeterinaryOfficeDashboard,
} from '../hooks';
import { veterinaryOfficeErrorMessage } from '../../validation/schemas';
import type { VeterinaryOfficeProduct } from '../../types';

const PRODUCT_PREVIEW_COUNT = 6;
const PRODUCT_CARD_WIDTH = 160;

interface QuickActionProps {
  icon: IconName;
  label: string;
  onPress: () => void;
}

function QuickAction({ icon, label, onPress }: QuickActionProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flex: 1,
          minWidth: '45%',
          alignItems: 'center',
          rowGap: theme.spacing.sm,
          paddingVertical: theme.spacing.lg,
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size="iconMd" color="primary" />
      </View>
      <Text variant="label" style={{ textAlign: 'center' }}>
        {label}
      </Text>
    </Pressable>
  );
}

interface StatProps {
  value: string | number;
  label: string;
  color: 'primary' | 'success' | 'info';
}

function Stat({ value, label, color }: StatProps) {
  return (
    <View style={{ alignItems: 'center', rowGap: 2 }}>
      <Text variant="heading" color={color}>
        {value}
      </Text>
      <Caption>{label}</Caption>
    </View>
  );
}

/** Route `/vet-office-dashboard/[organizationId]` — the Dashboard home. */
export default function VeterinaryOfficeDashboardHomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOfficeDashboard');
  const { t: tOffice } = useTranslation('veterinaryOffices');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const org = useOrganization(orgId);
  const isApproved = org.data?.status === 'ACTIVE';
  const canOperate = isApproved && org.data?.details.subscriptionStatus === 'ACTIVE';
  const isOwner = org.data?.myRole === 'OWNER';
  const renewals = useOrganizationSubscriptionRenewals(orgId, { enabled: isApproved });
  const summary = useVeterinaryOfficeDashboard(orgId);
  const products = useVeterinaryOfficeProducts(orgId, {
    status: 'ACTIVE',
    hidden: false,
    pageSize: PRODUCT_PREVIEW_COUNT,
  });
  const update = useUpdateVeterinaryOfficeProduct(orgId);
  const del = useDeleteVeterinaryOfficeProduct(orgId);

  const preview = products.products.slice(0, PRODUCT_PREVIEW_COUNT);

  const onToggleHidden = (product: VeterinaryOfficeProduct) => {
    update.mutate(
      { productId: product.id, body: { isHidden: !product.isHidden } },
      {
        onError: (error) =>
          toast.show({ tone: 'danger', message: veterinaryOfficeErrorMessage(error, tOffice) }),
      },
    );
  };
  const onDelete = (product: VeterinaryOfficeProduct) => {
    del.mutate(
      { productId: product.id },
      {
        onError: (error) =>
          toast.show({ tone: 'danger', message: veterinaryOfficeErrorMessage(error, tOffice) }),
      },
    );
  };

  return (
    <VeterinaryOfficeDashboardShell organizationId={orgId} active="home">
      <ScrollScreen padded={false}>
        {org.isLoading ? (
          <Section spacing="xl">
            <Loading />
          </Section>
        ) : org.isError || !org.data ? (
          <Section spacing="xl">
            <ErrorState error={org.error} onRetry={() => void org.refetch()} />
          </Section>
        ) : (
          <>
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
                  {org.data.details.logoUrl ?? org.data.details.galleryUrls?.[0] ? (
                    <Image
                      source={{ uri: (org.data.details.logoUrl ?? org.data.details.galleryUrls?.[0]) as string }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  ) : (
                    <Icon name="business" size="iconLg" color="primary" />
                  )}
                </View>
                <View style={{ flex: 1, rowGap: 2 }}>
                  <Heading level={3} numberOfLines={1}>
                    {org.data.name}
                  </Heading>
                  {org.data.description ? (
                    <Caption numberOfLines={2}>{org.data.description}</Caption>
                  ) : null}
                  {org.data.details.address ? (
                    <Row gap="xs">
                      <Icon name="location-outline" size="iconXs" color="textMuted" />
                      <Caption numberOfLines={1}>{org.data.details.address}</Caption>
                    </Row>
                  ) : null}
                </View>
              </Row>

              <Row justify="space-around" style={{ marginTop: theme.spacing.lg }}>
                <Stat
                  value={summary.data?.followersCount ?? 0}
                  label={t('home.followersCount')}
                  color="info"
                />
                <Stat
                  value={summary.data?.productsCount ?? 0}
                  label={t('home.productsLabel')}
                  color="success"
                />
                <Stat
                  value={summary.data?.rating ?? '—'}
                  label={t('home.ratingLabel')}
                  color="primary"
                />
              </Row>
            </View>

            <Section spacing="lg">
              <VeterinaryOfficeStatusCard
                approvalStatus={org.data.status}
                decisionReason={org.data.decisionReason}
                subscriptionStatus={org.data.details.subscriptionStatus}
                subscriptionEndDate={org.data.details.subscriptionEndDate}
                hasPendingRenewal={renewals.hasPendingRenewal}
                onRequestRenewal={
                  isOwner
                    ? () => router.push(Routes.organizationSubscriptionRenewal(orgId))
                    : undefined
                }
              />
            </Section>

            <Section spacing="lg">
              <Row gap="md">
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => router.push(Routes.vetOfficeDashboardProducts(orgId))}
                >
                  <View pointerEvents="none">
                    <SearchInput
                      value=""
                      onChangeText={() => undefined}
                      editable={false}
                      placeholder={t('home.searchPlaceholder')}
                      accessibilityLabel={t('home.searchPlaceholder')}
                    />
                  </View>
                </Pressable>
                {canOperate ? (
                  <Button
                    label={t('home.addProductCta')}
                    leftIcon="add"
                    onPress={() => router.push(Routes.organizationOfficeProductCreate(orgId))}
                  />
                ) : null}
              </Row>
            </Section>

            <Section spacing="lg">
              <Row justify="space-between" align="center">
                <Text variant="bodyStrong">{t('home.productsTitle')}</Text>
                {preview.length > 0 ? (
                  <Text
                    variant="label"
                    color="primary"
                    onPress={() => router.push(Routes.vetOfficeDashboardProducts(orgId))}
                  >
                    {t('home.viewAll')}
                  </Text>
                ) : null}
              </Row>
              {products.isLoading ? (
                <Loading />
              ) : preview.length === 0 ? (
                <EmptyState
                  icon="cube-outline"
                  title={t('home.emptyProducts')}
                  message={t('home.emptyProductsHint')}
                />
              ) : (
                <FlatList
                  data={preview}
                  keyExtractor={(p) => p.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: theme.spacing.md }}
                  ItemSeparatorComponent={() => <View style={{ width: theme.spacing.md }} />}
                  renderItem={({ item: p }) => (
                    <VeterinaryOfficeProductManageCard
                      product={p}
                      width={PRODUCT_CARD_WIDTH}
                      onPress={() => router.push(Routes.organizationOfficeProduct(orgId, p.id))}
                      onEdit={() => router.push(Routes.organizationOfficeProductEdit(orgId, p.id))}
                      onDelete={() => onDelete(p)}
                      onToggleHidden={() => onToggleHidden(p)}
                      readOnly={!canOperate}
                    />
                  )}
                />
              )}
            </Section>

            {canOperate ? (
              <Section spacing="giant">
                <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.md }}>
                  {t('home.quickActionsTitle')}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
                  <QuickAction
                    icon="settings-outline"
                    label={t('home.settingsCta')}
                    onPress={() => router.push(Routes.organizationEdit(orgId))}
                  />
                  <QuickAction
                    icon="eye-off-outline"
                    label={t('home.hiddenProductsCta')}
                    onPress={() => router.push(Routes.vetOfficeDashboardHiddenProducts(orgId))}
                  />
                  <QuickAction
                    icon="chatbubbles-outline"
                    label={t('home.conversationsCta')}
                    onPress={() => router.push(Routes.vetOfficeDashboardConversations(orgId))}
                  />
                  <QuickAction
                    icon="paper-plane-outline"
                    label={t('home.sendMessageCta')}
                    onPress={() => router.push(Routes.vetOfficeDashboardBroadcast(orgId))}
                  />
                  <QuickAction
                    icon="people-outline"
                    label={t('home.membersCta')}
                    onPress={() => router.push(Routes.organizationMembers(orgId))}
                  />
                  <QuickAction
                    icon="shield-checkmark-outline"
                    label={t('home.supervisorsCta')}
                    onPress={() => router.push(Routes.organizationSupervisors(orgId))}
                  />
                </View>
              </Section>
            ) : null}
          </>
        )}
      </ScrollScreen>
    </VeterinaryOfficeDashboardShell>
  );
}
