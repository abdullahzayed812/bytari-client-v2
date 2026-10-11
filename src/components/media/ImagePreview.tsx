import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { Caption } from '@/components/typography';
import { useTheme } from '@/theme';

export interface ImagePreviewProps {
  uri: string;
  /** Height (and width, unless `aspectRatio` is set). */
  size?: number;
  shape?: 'circle' | 'square';
  /** width / height of a square-shaped preview — e.g. a banner thumbnail. */
  aspectRatio?: number;
  /** 0–1 while uploading. */
  progress?: number;
  uploading?: boolean;
  error?: boolean;
  onRemove?: () => void;
  onRetry?: () => void;
}

/** A picked/uploaded image with an upload overlay, remove and retry affordances. */
export function ImagePreview({
  uri,
  size = 96,
  shape = 'square',
  aspectRatio,
  progress,
  uploading,
  error,
  onRemove,
  onRetry,
}: ImagePreviewProps) {
  const theme = useTheme();
  const radius = shape === 'circle' ? size / 2 : theme.radius.lg;
  const width = shape === 'square' && aspectRatio ? Math.round(size * aspectRatio) : size;

  return (
    <View style={{ width, height: size }}>
      <Image
        source={{ uri }}
        style={{ width, height: size, borderRadius: radius }}
        contentFit="cover"
        transition={150}
        accessibilityIgnoresInvertColors
      />

      {(uploading || error) && (
        <View
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: radius,
            backgroundColor: theme.colors.overlay,
            alignItems: 'center',
            justifyContent: 'center',
            rowGap: 4,
          }}
        >
          {uploading ? (
            <>
              <ActivityIndicator color={theme.colors.onPrimary} />
              {typeof progress === 'number' ? (
                <Caption style={{ color: theme.colors.onPrimary }}>
                  {Math.round(progress * 100)}%
                </Caption>
              ) : null}
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="retry"
              onPress={onRetry}
              hitSlop={8}
            >
              <Icon name="refresh" size="iconMd" color="onPrimary" />
            </Pressable>
          )}
        </View>
      )}

      {onRemove && !uploading ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="remove"
          onPress={onRemove}
          hitSlop={8}
          style={{
            position: 'absolute',
            top: -6,
            insetInlineEnd: -6,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: theme.colors.danger,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="close" size="iconXs" color="onPrimary" />
        </Pressable>
      ) : null}
    </View>
  );
}
