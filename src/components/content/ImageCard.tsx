import { Image, View } from 'react-native';

import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { Card } from './Card';

export interface ImageCardProps {
  title: string;
  subtitle?: string;
  imageUri?: string;
  onPress?: () => void;
  aspectRatio?: number;
}

/** Card with a rounded hero image on top and a text block below. */
export function ImageCard({
  title,
  subtitle,
  imageUri,
  onPress,
  aspectRatio = 16 / 10,
}: ImageCardProps) {
  const theme = useTheme();
  return (
    <Card padding="none" onPress={onPress} accessibilityLabel={title}>
      <View
        style={{
          aspectRatio,
          borderTopLeftRadius: theme.radius.xl,
          borderTopRightRadius: theme.radius.xl,
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceAccent,
        }}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : null}
      </View>
      <View style={{ padding: theme.spacing.lg, rowGap: theme.spacing.xxs }}>
        <Text variant="subtitle" weight="medium" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textMuted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
