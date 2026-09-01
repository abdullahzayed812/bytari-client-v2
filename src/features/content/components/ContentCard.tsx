import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { CONTENT_TYPE_META } from '../constants';
import type { ContentItem } from '../types';

export interface ContentCardProps {
  item: ContentItem;
  onPress?: () => void;
}

/** Presentation-only content row. Renders only the safe `ContentItem` fields (§5). */
export function ContentCard({ item, onPress }: ContentCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('content');
  const meta = CONTENT_TYPE_META[item.type];
  const primaryCategory = item.categories[0]?.name;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('card.openLabel', { title: item.title })}
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
          width: 48,
          height: 48,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={meta.icon} size="iconMd" color="primary" />
      </View>

      <View style={{ flex: 1, rowGap: 4 }}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {item.title}
        </Text>
        {item.authorName ? (
          <Caption numberOfLines={1}>{t('card.by', { author: item.authorName })}</Caption>
        ) : null}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            columnGap: theme.spacing.sm,
            rowGap: 4,
            marginTop: 2,
          }}
        >
          <Badge label={t(`type.${item.type}`)} tone={meta.tone} size="sm" />
          {primaryCategory ? <Caption numberOfLines={1}>{primaryCategory}</Caption> : null}
          {item.publishedAt ? <Caption>· {formatDate(item.publishedAt)}</Caption> : null}
        </View>
      </View>

      <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
    </Pressable>
  );
}
