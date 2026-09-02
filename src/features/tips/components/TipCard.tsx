import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { categoryIcon, TIP_PRIORITY_META } from '../constants';
import type { TipListItem } from '../types';

export interface TipCardProps {
  tip: TipListItem;
  /** Fixed column width so the 2-up grid lays out evenly. */
  width: number;
  onPress?: () => void;
  onToggleBookmark?: (next: boolean) => void;
}

const COVER_RATIO = 3 / 2;

/** Grid card for "أهم النصائح" — cover, priority badge, title, category, meta. */
export function TipCard({ tip, width, onPress, onToggleBookmark }: TipCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('tips');
  const priority = TIP_PRIORITY_META[tip.priority];
  const coverHeight = Math.round((width * 0.72) / COVER_RATIO) + 24;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('card.open', { title: tip.title })}
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
        {tip.coverImageUrl ? (
          <Image
            source={tip.coverImageUrl}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bulb-outline" size="iconLg" color="primary" />
          </View>
        )}
        {priority.show ? (
          <View style={{ position: 'absolute', top: theme.spacing.sm, start: theme.spacing.sm }}>
            <Badge label={t(`priority.${tip.priority}`)} tone={priority.tone} size="sm" />
          </View>
        ) : null}
      </View>

      <View style={{ padding: theme.spacing.md, rowGap: theme.spacing.sm }}>
        <Text variant="bodyStrong" numberOfLines={2} center>
          {tip.title}
        </Text>

        {tip.category ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'center',
              columnGap: theme.spacing.xs,
              backgroundColor: theme.colors.surfaceAccent,
              borderRadius: theme.radius.pill,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: 2,
            }}
          >
            <Icon name={categoryIcon(tip.category.slug)} size="iconXs" color="primary" />
            <Text variant="overline" color="success">
              {tip.category.name}
            </Text>
          </View>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: theme.spacing.xs,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
            <Icon name="time-outline" size="iconXs" color="textMuted" />
            <Caption>
              {tip.readMinutes
                ? t('meta.minutes', { count: tip.readMinutes })
                : t('meta.quickRead')}
            </Caption>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tip.isBookmarked ? t('actions.unsaveA11y') : t('actions.saveA11y')}
            hitSlop={10}
            onPress={() => onToggleBookmark?.(!tip.isBookmarked)}
          >
            <Icon
              name={tip.isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size="iconSm"
              color={tip.isBookmarked ? 'primary' : 'textMuted'}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
