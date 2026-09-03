import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import type { ContentItem } from '@/features/content/types';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

interface Props {
  item: ContentItem;
  width: number;
  onPress: () => void;
}

/** Compact horizontal news card for the "آخر الأخبار" strip on the landing screen. */
export function NewsCard({ item, width, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
          ...theme.shadows.xs,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View
        style={{
          height: width * 0.6,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {item.coverImageUrl ? (
          <Image
            source={item.coverImageUrl}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Icon name="newspaper-outline" size="iconLg" color="primary" />
        )}
      </View>
      <View style={{ padding: theme.spacing.md, rowGap: theme.spacing.xs }}>
        <Text variant="label" numberOfLines={2}>
          {item.title}
        </Text>
        {item.publishedAt ? <Caption>{formatDate(item.publishedAt)}</Caption> : null}
      </View>
    </Pressable>
  );
}
