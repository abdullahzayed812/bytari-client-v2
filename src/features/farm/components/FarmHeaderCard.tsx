import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import type { FarmCategory, FarmProfile } from '../types';

interface Props {
  name: string;
  location?: string | null;
  profile?: FarmProfile | null;
}

/** Farm Details header — image, name, location, total capacity, establishment date, type icon. */
export function FarmHeaderCard({ name, location, profile }: Props) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const loc = location ?? profile?.address ?? null;

  const rows: { icon: Parameters<typeof Icon>[0]['name']; label: string; value: string }[] = [];
  if (loc) rows.push({ icon: 'location-outline', label: t('details.locationLabel'), value: loc });
  if (profile?.capacity != null) {
    rows.push({
      icon: 'egg-outline',
      label: t('details.capacityLabel'),
      value: t('details.capacityValue', { count: profile.capacity }),
    });
  }
  if (profile?.establishedOn) {
    rows.push({
      icon: 'calendar-outline',
      label: t('details.establishedLabel'),
      value: formatDate(profile.establishedOn),
    });
  }

  return (
    <View
      style={{
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.lg,
        flexDirection: 'row',
        columnGap: theme.spacing.lg,
        ...theme.shadows.card,
      }}
    >
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: theme.radius.lg,
          overflow: 'hidden',
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
          <Icon name="egg-outline" size="iconXl" color="primary" />
        )}
      </View>

      <View style={{ flex: 1, rowGap: theme.spacing.xs }}>
        <Text variant="subtitle" weight="bold" numberOfLines={2}>
          {name}
        </Text>
        {profile?.farmCategory ? (
          <Caption>{t(`category.${profile.farmCategory as FarmCategory}`)}</Caption>
        ) : null}
        {rows.map((r) => (
          <View
            key={r.label}
            style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}
          >
            <Icon name={r.icon} size="iconXs" color="primary" />
            <Caption numberOfLines={1}>
              {r.label}: {r.value}
            </Caption>
          </View>
        ))}
      </View>
    </View>
  );
}
