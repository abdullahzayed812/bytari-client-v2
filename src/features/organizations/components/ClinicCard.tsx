import { useTranslation } from 'react-i18next';
import { Pressable, View, type DimensionValue } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { ORG_TYPE_ICON } from '../constants';
import type { PublicOrganization } from '../types';

export interface ClinicCardProps {
  organization: PublicOrganization;
  width: DimensionValue;
  onPress: () => void;
}

const IMAGE_SIZE = 84;

/**
 * Clinic card for the discover list / Home "Available clinics" row.
 *
 * Address / distance are real, backend-resolved fields (organization
 * directory profile + server-computed `sort=nearest` distance) — shown only
 * when present. There is still no cover photo or rating on `Organization`
 * (rating would need a whole review system), so a type-icon tile stands in
 * for the photo. The "verified" badge reuses real data instead of inventing
 * a field — `/organizations/discover` only ever returns `status = ACTIVE`
 * organizations, i.e. admin-approved, so every card shown here legitimately
 * earns the badge.
 */
export function ClinicCard({ organization, width, onPress }: ClinicCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('organizations');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={organization.name}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width,
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.md,
          padding: theme.spacing.md,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.xs,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View
        style={{
          width: IMAGE_SIZE,
          height: IMAGE_SIZE,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={ORG_TYPE_ICON[organization.type]} size="iconLg" color="primary" />
      </View>

      <View style={{ flex: 1, rowGap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
            {organization.name}
          </Text>
          <View accessible accessibilityLabel={t('discover.verifiedA11y')}>
            <Icon name="checkmark-circle" size="iconSm" color="primary" />
          </View>
          {organization.distanceKm != null ? (
            <Text variant="caption" color="primary" numberOfLines={1}>
              {t('discover.distanceKm', { value: organization.distanceKm })}
            </Text>
          ) : null}
        </View>
        {organization.address ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 2 }}>
            <Icon name="location-outline" size="iconXs" color="textMuted" />
            <Caption numberOfLines={1} style={{ flexShrink: 1 }}>
              {organization.address}
            </Caption>
          </View>
        ) : organization.description ? (
          <Caption numberOfLines={2}>{organization.description}</Caption>
        ) : null}
      </View>

      <Icon name="chevron-forward" size="iconSm" color="textMuted" directional />
    </Pressable>
  );
}
