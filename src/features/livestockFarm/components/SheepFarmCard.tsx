import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { OrganizationStatusBadge } from '@/features/organizations/components';
import type { OrganizationStatus } from '@/features/organizations/types';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import type { LivestockFarmProfile } from '../types';

export interface SheepHeadcountStats {
  total: number;
  lambs: number;
  males: number;
  females: number;
}

export interface SheepFarmCardProps {
  name: string;
  profile?: LivestockFarmProfile | null;
  location?: string | null;
  stats?: SheepHeadcountStats | null;
  status?: OrganizationStatus;
  onPressDetails: () => void;
}

/** The sheep-farm card on the combined landing screen — mirrors `PoultryFarmCard` exactly. */
export function SheepFarmCard({ name, profile, location, stats, status, onPressDetails }: SheepFarmCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('sheepCattleFarm');
  const loc = location ?? profile?.address ?? null;

  const statCells: { label: string; value: number }[] = stats
    ? [
        { label: t('landing.statTotal'), value: stats.total },
        { label: t('landing.sheepStatLambs'), value: stats.lambs },
        { label: t('landing.sheepStatMales'), value: stats.males },
        { label: t('landing.sheepStatFemales'), value: stats.females },
      ]
    : [];

  return (
    <View
      style={{
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
          {profile?.imageUrl ? (
            <Image
              source={profile.imageUrl}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Icon name="paw-outline" size="iconXl" color="primary" />
          )}
        </View>

        <View style={{ flex: 1, padding: theme.spacing.lg, rowGap: theme.spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
              {name}
            </Text>
            {status && status !== 'ACTIVE' ? <OrganizationStatusBadge status={status} size="sm" /> : null}
          </View>

          {loc ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
              <Icon name="location-outline" size="iconXs" color="textMuted" />
              <Caption numberOfLines={1}>{loc}</Caption>
            </View>
          ) : null}

          {profile?.establishedOn ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
              <Icon name="calendar-outline" size="iconXs" color="textMuted" />
              <Caption>{t('landing.establishedOn', { date: formatDate(profile.establishedOn) })}</Caption>
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
