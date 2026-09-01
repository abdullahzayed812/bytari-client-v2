import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { FLOCK_STATUS_TONE, birdTypeIcon } from '../constants';
import type { PoultryFlock } from '../types';

export interface PoultryCardProps {
  flock: PoultryFlock;
  onPress?: () => void;
}

/** Presentation-only poultry-flock row. Renders only backend DTO fields. */
export function PoultryCard({ flock, onPress }: PoultryCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('farm');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('poultry.openLabel', { name: flock.name })}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.lg,
          padding: theme.spacing.lg,
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
          width: 44,
          height: 44,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={birdTypeIcon(flock.birdType)} size="iconMd" color="primary" />
      </View>

      <View style={{ flex: 1, rowGap: 4 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {flock.name}
        </Text>
        <Caption numberOfLines={1}>
          {t(`birdType.${flock.birdType}`, { defaultValue: flock.birdType })} ·{' '}
          {t('poultry.birdCountShort', { count: flock.birdCount })}
        </Caption>
        <View style={{ marginTop: 2 }}>
          <Badge
            label={t(`flockStatus.${flock.status}`)}
            tone={FLOCK_STATUS_TONE[flock.status]}
            size="sm"
          />
        </View>
      </View>

      <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
    </Pressable>
  );
}
