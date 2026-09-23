import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { Caption } from '@/components/typography';
import { useTheme } from '@/theme';

export interface ImageThumbnailRowProps {
  /** Already-resolved remote URLs (R2 public or signed). */
  images: string[];
  /** Tapping thumbnail `index` — typically opens an `ImageViewer` at that index. */
  onPress?: (index: number) => void;
  size?: number;
  /** Shown instead of the row when `images` is empty. Omit to render nothing. */
  emptyLabel?: string;
  /**
   * When `images` is empty and there is no `emptyLabel`, still render one
   * inert placeholder tile. Use in list rows where the missing tile would
   * otherwise shift the layout; leave off in detail panels.
   */
  placeholderWhenEmpty?: boolean;
  /** Glyph shown while loading and when an image fails to load. */
  fallbackIcon?: IconName;
  accessibilityLabelFor?: (index: number, total: number) => string;
}

const DEFAULT_SIZE = 72;

/**
 * A wrapping row of tappable image thumbnails — the single way every admin
 * review surface (organization gallery / license documents, animal
 * publications, veterinarian identity documents, market offers, …) shows an
 * entity's photos. Pair with the shared `ImageViewer` for the full-screen,
 * zoomable, swipeable view; never re-implement either per feature.
 *
 * A broken or still-loading URL degrades to the placeholder glyph rather than
 * an empty box, so an expired signed URL is visibly missing, not invisible.
 */
export function ImageThumbnailRow({
  images,
  onPress,
  size = DEFAULT_SIZE,
  emptyLabel,
  placeholderWhenEmpty,
  fallbackIcon = 'image-outline',
  accessibilityLabelFor,
}: ImageThumbnailRowProps) {
  const theme = useTheme();

  if (images.length === 0) {
    if (emptyLabel) return <Caption color="textMuted">{emptyLabel}</Caption>;
    if (!placeholderWhenEmpty) return null;
    return <EmptyTile size={size} icon={fallbackIcon} />;
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
      {images.map((uri, index) => (
        <Thumbnail
          key={`${uri}-${index}`}
          uri={uri}
          size={size}
          fallbackIcon={fallbackIcon}
          accessibilityLabel={
            accessibilityLabelFor?.(index, images.length) ?? `${index + 1}/${images.length}`
          }
          onPress={onPress ? () => onPress(index) : undefined}
        />
      ))}
    </View>
  );
}

function EmptyTile({ size, icon }: { size: number; icon: IconName }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceAccent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size="iconSm" color="textMuted" />
    </View>
  );
}

function Thumbnail({
  uri,
  size,
  fallbackIcon,
  accessibilityLabel,
  onPress,
}: {
  uri: string;
  size: number;
  fallbackIcon: IconName;
  accessibilityLabel: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);

  return (
    <Pressable
      accessibilityRole={onPress ? 'imagebutton' : 'image'}
      accessibilityLabel={accessibilityLabel}
      disabled={!onPress || failed}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: theme.radius.md,
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pressed && { opacity: 0.8 },
      ]}
    >
      {failed ? (
        <Icon name={fallbackIcon} size="iconSm" color="textMuted" />
      ) : (
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={120}
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      )}
    </Pressable>
  );
}
