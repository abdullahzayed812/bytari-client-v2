import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { TextButton } from '@/components/actions';
import { Badge, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
// Deep import (not the `@/features/veterinaryOffices` barrel) — that
// barrel's dashboard screens import `@/features/organizations`, so importing
// the full barrel back from here would create a require cycle.
import { useVeterinaryOfficeDashboard } from '@/features/veterinaryOffices/dashboard/hooks/useVeterinaryOfficeDashboard';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { ORG_STATUS_TONE, ORG_TYPE_ICON } from '../constants';
import type { MyOrganization } from '../types';

export interface OwnedOrganizationCardProps {
  organization: MyOrganization;
  onEnterDashboard?: () => void;
  onPress?: () => void;
}

const SUBSCRIPTION_TONE = { ACTIVE: 'success', NOT_STARTED: 'neutral', EXPIRED: 'danger' } as const;

/**
 * "My Veterinary Organizations" owned-org card (VETERINARY_OFFICE / CLINIC) —
 * owner badge, approval-status pill, address/phone, subscription valid-until,
 * stats, "دخول لوحة التحكم" CTA. Richer than the plain `OrganizationCard` (list
 * item for every membership/role) — this is specifically the owner-facing card
 * from the Veterinary Office Dashboard reference screenshots.
 */
export function OwnedOrganizationCard({
  organization: org,
  onEnterDashboard,
  onPress,
}: OwnedOrganizationCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const isOwner = org.myRole === 'OWNER';
  const isOffice = org.type === 'VETERINARY_OFFICE';

  // Stats (products/sales/followers) are an office-only concept — no dashboard
  // summary endpoint exists for CLINIC.
  const summary = useVeterinaryOfficeDashboard(isOffice ? org.id : '');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={org.name}
      onPress={onPress}
      style={({ pressed }) => [
        {
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
          ...theme.shadows.xs,
        },
        pressed && { opacity: 0.92 },
      ]}
    >
      <View style={{ height: 140, backgroundColor: theme.colors.surfaceAccent }}>
        {org.logoUrl ? (
          <Image source={{ uri: org.logoUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={ORG_TYPE_ICON[org.type]} size="iconXl" color="primary" />
          </View>
        )}
        {isOwner ? (
          <View style={{ position: 'absolute', top: theme.spacing.sm, insetInlineStart: theme.spacing.sm }}>
            <Badge label={t('card.owner')} tone="success" size="sm" />
          </View>
        ) : null}
      </View>

      <View style={{ padding: theme.spacing.lg, rowGap: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {org.name}
          </Text>
          <Badge label={t(`status.${org.status}`)} tone={ORG_STATUS_TONE[org.status]} size="sm" />
        </View>

        {org.address ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
            <Icon name="location-outline" size="iconXs" color="textMuted" />
            <Caption numberOfLines={1}>{org.address}</Caption>
          </View>
        ) : null}

        {org.phone ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
            <Icon name="call-outline" size="iconXs" color="textMuted" />
            <Caption numberOfLines={1}>{org.phone}</Caption>
          </View>
        ) : null}

        {org.subscriptionStatus ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
              <Icon name="calendar-outline" size="iconXs" color="textMuted" />
              <Caption>
                {org.subscriptionEndDate
                  ? t('card.subscriptionValidUntil', { date: formatDate(org.subscriptionEndDate) })
                  : t('card.subscriptionNotStarted')}
              </Caption>
            </View>
            <Badge
              label={t(`subscriptionStatus.${org.subscriptionStatus}`)}
              tone={SUBSCRIPTION_TONE[org.subscriptionStatus]}
              size="sm"
            />
          </View>
        ) : null}

        {org.subscriptionStatus === 'EXPIRED' || org.subscriptionStatus === 'NOT_STARTED' ? (
          <TextButton
            label={t('renewal.title')}
            icon="refresh-outline"
            onPress={() => router.push(Routes.organizationSubscriptionRenewal(org.id))}
          />
        ) : null}

        {isOffice ? (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              paddingTop: theme.spacing.sm,
              borderTopWidth: theme.sizes.hairline,
              borderTopColor: theme.colors.divider,
            }}
          >
            <Stat value={summary.data?.productsCount ?? 0} label={t('card.products')} />
            <Stat value={summary.data?.salesCount ?? 0} label={t('card.sales')} />
            <Stat value={summary.data?.followersCount ?? 0} label={t('card.followers')} />
          </View>
        ) : null}

        {isOffice ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('card.enterDashboard')}
            onPress={onEnterDashboard}
            style={({ pressed }) => [
              {
                marginTop: theme.spacing.xs,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radius.lg,
                alignItems: 'center',
                backgroundColor: theme.colors.primarySoft,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text variant="label" color="primary">
              {t('card.enterDashboard')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ alignItems: 'center', rowGap: 2 }}>
      <Text variant="bodyStrong">{value}</Text>
      <Caption>{label}</Caption>
    </View>
  );
}
