import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View, type DimensionValue } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { OrganizationStatusBadge } from '@/features/organizations/components';
import type { OrganizationStatus } from '@/features/organizations/types';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import type { FarmProfile } from '../types';

export interface FarmBirdStats {
  total: number;
  chicken: number;
  turkey: number;
  duck: number;
  other: number;
}

export interface PoultryFarmCardProps {
  name: string;
  profile?: FarmProfile | null;
  location?: string | null;
  /** The farm photo from the list DTO — same image every farm type shows (falls back to `profile.imageUrl`). */
  imageUrl?: string | null;
  stats?: FarmBirdStats | null;
  /**
   * The farm's approval status — surfaced here so a PENDING/REJECTED/
   * SUSPENDED/DEACTIVATED farm is never hidden from its owner on the landing
   * list (spec §3). Omitted (or ACTIVE) keeps the card visually unchanged.
   */
  status?: OrganizationStatus;
  /** Fixed width — set when the card sits in a horizontal list (the landing carousel). */
  width?: DimensionValue;
  onPressDetails: () => void;
  onPressMenu?: () => void;
}

/** The "حقل دواجني" card on the landing screen — image, name, location, date, bird stats. */
export function PoultryFarmCard({
  name,
  profile,
  location,
  imageUrl,
  stats,
  status,
  width,
  onPressDetails,
  onPressMenu,
}: PoultryFarmCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const loc = location ?? profile?.address ?? null;

  const statCells: { label: string; value: number }[] = stats
    ? [
        { label: t('farmCard.totalBirds'), value: stats.total },
        { label: t('farmCard.chicken'), value: stats.chicken },
        { label: t('farmCard.turkeys'), value: stats.turkey },
        { label: t('farmCard.ducks'), value: stats.duck },
      ]
    : [];

  return (
    <View
      style={{
        width,
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
        ...theme.shadows.card,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        <View
          style={{
            width: 128,
            backgroundColor: theme.colors.surfaceAccent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {(imageUrl ?? profile?.imageUrl) ? (
            <Image
              source={(imageUrl ?? profile?.imageUrl) as string}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Icon name="egg-outline" size="iconXl" color="primary" />
          )}
        </View>

        <View style={{ flex: 1, padding: theme.spacing.lg, rowGap: theme.spacing.xs }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
              {name}
            </Text>
            {status && status !== 'ACTIVE' ? (
              <View style={{ marginEnd: onPressMenu ? theme.spacing.xs : 0 }}>
                <OrganizationStatusBadge status={status} size="sm" />
              </View>
            ) : null}
            {onPressMenu ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={name}
                hitSlop={8}
                onPress={onPressMenu}
              >
                <Icon name="ellipsis-vertical" size="iconSm" color="textMuted" />
              </Pressable>
            ) : null}
          </View>

          {loc ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}
            >
              <Icon name="location-outline" size="iconXs" color="textMuted" />
              <Caption numberOfLines={1}>{loc}</Caption>
            </View>
          ) : null}

          {profile?.establishedOn ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}
            >
              <Icon name="calendar-outline" size="iconXs" color="textMuted" />
              <Caption>
                {t('farmCard.establishedOn', { date: formatDate(profile.establishedOn) })}
              </Caption>
            </View>
          ) : null}
        </View>
      </View>

      {statCells.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            padding: theme.spacing.md,
            paddingTop: 0,
            gap: theme.spacing.sm,
          }}
        >
          {statCells.map((cell) => (
            <View
              key={cell.label}
              style={{
                flexGrow: 1,
                flexBasis: '22%',
                minWidth: 72,
                alignItems: 'center',
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surfaceMuted,
              }}
            >
              <Caption numberOfLines={1}>{cell.label}</Caption>
              <Text variant="bodyStrong">{cell.value.toLocaleString()}</Text>
              <Caption>{t('farmCard.unit')}</Caption>
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ padding: theme.spacing.md, paddingTop: 0 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('landing.details')}
          onPress={onPressDetails}
          style={({ pressed }) => [
            {
              alignSelf: 'flex-start',
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.lg,
              borderRadius: theme.radius.pill,
              borderWidth: 1,
              borderColor: theme.colors.primary,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text variant="label" color="primary">
            {t('landing.details')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
