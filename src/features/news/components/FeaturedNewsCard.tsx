import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/actions';
import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { newsCategoryIcon } from '../constants';
import type { News } from '../types';

export interface FeaturedNewsCardProps {
  item: News;
  onPress: () => void;
}

/** The "خبر مميز" hero card — green surface, cover, title, summary, source, CTA. */
export function FeaturedNewsCard({ item, onPress }: FeaturedNewsCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('news');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('card.open', { title: item.title })}
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
          {item.title}
        </Text>
        {item.summary ? <Caption numberOfLines={3}>{item.summary}</Caption> : null}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            columnGap: theme.spacing.md,
            rowGap: theme.spacing.xs,
          }}
        >
          {item.publishedAt ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}
            >
              <Icon name="calendar-outline" size="iconXs" color="textMuted" />
              <Caption>{formatDate(item.publishedAt)}</Caption>
            </View>
          ) : null}
          {item.category ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}
            >
              <Icon name={newsCategoryIcon(item.category.slug)} size="iconXs" color="primary" />
              <Caption>{item.category.name}</Caption>
            </View>
          ) : null}
        </View>

        <View style={{ marginTop: theme.spacing.xs, alignSelf: 'flex-start' }}>
          <Button label={t('featured.cta')} onPress={onPress} size="sm" rightIcon="arrow-forward" />
        </View>
      </View>

      {item.coverImageUrl ? (
        <Image
          source={item.coverImageUrl}
          style={{ width: 128, alignSelf: 'stretch' }}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </Pressable>
  );
}
