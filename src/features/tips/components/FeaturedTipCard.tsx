import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/actions';
import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import type { Tip } from '../types';

export interface FeaturedTipCardProps {
  tip: Tip;
  onPress: () => void;
}

/** The "نصيحة اليوم" hero card — green surface, cover, title, summary, CTA. */
export function FeaturedTipCard({ tip, onPress }: FeaturedTipCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('tips');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('card.open', { title: tip.title })}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.surfaceAccent,
          overflow: 'hidden',
        },
        pressed && { opacity: 0.92 },
      ]}
    >
      <View style={{ flex: 1, padding: theme.spacing.lg, rowGap: theme.spacing.sm }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            columnGap: theme.spacing.xs,
            backgroundColor: theme.colors.primary,
            borderRadius: theme.radius.pill,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 3,
          }}
        >
          <Icon name="star" size="iconXs" color="onPrimary" />
          <Text variant="overline" style={{ color: theme.colors.onPrimary }} weight="bold">
            {t('featured.badge')}
          </Text>
        </View>

        <Text variant="title" weight="bold" numberOfLines={3}>
          {tip.title}
        </Text>
        {tip.summary ? <Caption numberOfLines={3}>{tip.summary}</Caption> : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
          <Icon name="time-outline" size="iconXs" color="textMuted" />
          <Caption>
            {tip.readMinutes ? t('meta.minutes', { count: tip.readMinutes }) : t('meta.quickRead')}
          </Caption>
        </View>

        <View style={{ marginTop: theme.spacing.xs, alignSelf: 'flex-start' }}>
          <Button label={t('featured.cta')} onPress={onPress} size="sm" />
        </View>
      </View>

      {tip.coverImageUrl ? (
        <Image
          source={tip.coverImageUrl}
          style={{ width: 128, alignSelf: 'stretch' }}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </Pressable>
  );
}
