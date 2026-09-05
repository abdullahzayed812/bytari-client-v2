import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { NEWS_TAG_META, newsCategoryIcon } from '../constants';
import type { NewsListItem } from '../types';

export interface NewsCardProps {
  item: NewsListItem;
  width: number;
  onPress?: () => void;
  onToggleBookmark?: (next: boolean) => void;
}

/** Grid / strip card for "أحدث الأخبار" — cover, tag badge, title, category, date. */
export function NewsCard({ item, width, onPress, onToggleBookmark }: NewsCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('news');
  const tagMeta = NEWS_TAG_META[item.tag];
  const coverHeight = Math.round(width * 0.58);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('card.open', { title: item.title })}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
          ...theme.shadows.xs,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={{ height: coverHeight, backgroundColor: theme.colors.surfaceAccent }}>
        {item.coverImageUrl ? (
          <Image
            source={item.coverImageUrl}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="newspaper-outline" size="iconLg" color="primary" />
          </View>
        )}
        {tagMeta.show ? (
          <View style={{ position: 'absolute', top: theme.spacing.sm, start: theme.spacing.sm }}>
            <Badge label={t(`tag.${item.tag}`)} tone={tagMeta.tone} size="sm" />
          </View>
        ) : null}
      </View>

      <View style={{ padding: theme.spacing.md, rowGap: theme.spacing.sm }}>
        <Text variant="label" weight="bold" numberOfLines={2}>
          {item.title}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {item.publishedAt ? <Caption>{formatDate(item.publishedAt)}</Caption> : <View />}
          {onToggleBookmark ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                item.isBookmarked ? t('actions.unsaveA11y') : t('actions.saveA11y')
              }
              hitSlop={10}
              onPress={() => onToggleBookmark(!item.isBookmarked)}
            >
              <Icon
                name={item.isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size="iconSm"
                color={item.isBookmarked ? 'primary' : 'textMuted'}
              />
            </Pressable>
          ) : null}
        </View>

        {item.category ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              columnGap: theme.spacing.xs,
              backgroundColor: theme.colors.surfaceAccent,
              borderRadius: theme.radius.pill,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: 2,
            }}
          >
            <Icon name={newsCategoryIcon(item.category.slug)} size="iconXs" color="primary" />
            <Text variant="overline" color="success">
              {item.category.name}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
