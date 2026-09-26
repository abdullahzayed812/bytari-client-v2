import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View, type DimensionValue } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { OrganizationStatusBadge } from '@/features/organizations/components';
import type { OrganizationStatus } from '@/features/organizations/types';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import type { LivestockFarmProfile } from '../types';

export interface CattleHeadcountStats {
  total: number;
  calves: number;
  bulls: number;
  cows: number;
}

export interface CattleFarmCardProps {
  name: string;
  profile?: LivestockFarmProfile | null;
  location?: string | null;
  /** The farm photo from the list DTO — same image every farm type shows (falls back to `profile.imageUrl`). */
  imageUrl?: string | null;
  stats?: CattleHeadcountStats | null;
  status?: OrganizationStatus;
  /** Fixed width — set when the card sits in a horizontal list. */
  width?: DimensionValue;
  onPressDetails: () => void;
}

/** The cattle-farm card on the combined landing screen — mirrors `SheepFarmCard`/`PoultryFarmCard`. */
export function CattleFarmCard({
  name,
  profile,
  location,
  imageUrl,
  stats,
  status,
  width,
  onPressDetails,
}: CattleFarmCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('sheepCattleFarm');
  const loc = location ?? profile?.address ?? null;

  const statCells: { label: string; value: number }[] = stats
    ? [
        { label: t('landing.statTotal'), value: stats.total },
        { label: t('landing.cattleStatCalves'), value: stats.calves },
        { label: t('landing.cattleStatBulls'), value: stats.bulls },
        { label: t('landing.cattleStatCows'), value: stats.cows },
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
            <Icon name="paw-outline" size="iconXl" color="primary" />
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
              <OrganizationStatusBadge status={status} size="sm" />
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
                {t('landing.establishedOn', { date: formatDate(profile.establishedOn) })}
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
