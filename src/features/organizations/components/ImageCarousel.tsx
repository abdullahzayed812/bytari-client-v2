import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { Icon } from '@/components/content';
import { ImageViewer } from '@/components/media';
import { BackButton } from '@/components/navigation';
import { useTheme } from '@/theme';

const HEIGHT = 260;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface ImageCarouselProps {
  images: string[];
  /**
   * Tap a photo to open the shared full-screen `ImageViewer` (pinch/double-tap
   * zoom, swipe between photos). On by default — pass `false` only where a tap
   * must do something else.
   */
  enableViewer?: boolean;
}

/**
 * Full-bleed hero carousel with dot pagination and a floating back button —
 * the Clinic Details top section. Falls back to a single placeholder tile
 * (no dots) when the clinic has no gallery photos yet — real empty state,
 * never a fake stock photo. Tapping a photo opens the shared `ImageViewer`.
 */
export function ImageCarousel({ images, enableViewer = true }: ImageCarouselProps) {
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  }, []);

  return (
    <View style={{ height: HEIGHT, backgroundColor: theme.colors.surfaceMuted }}>
      {images.length > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
        >
          {images.map((uri, index) => (
            <Pressable
              key={uri}
              accessibilityRole={enableViewer ? 'imagebutton' : 'image'}
              accessibilityLabel={`${index + 1}/${images.length}`}
              disabled={!enableViewer}
              onPress={() => setViewerIndex(index)}
            >
              <Image
                source={uri}
                style={{ width: SCREEN_WIDTH, height: HEIGHT }}
                contentFit="cover"
                accessibilityIgnoresInvertColors
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="image-outline" size="iconXl" color="textMuted" />
        </View>
      )}

      <View style={{ position: 'absolute', top: theme.spacing.md, left: theme.spacing.md }}>
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.pill,
            ...theme.shadows.xs,
          }}
        >
          <BackButton />
        </View>
      </View>

      {images.length > 1 ? (
        <View
          style={{
            position: 'absolute',
            bottom: theme.spacing.md,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'center',
            columnGap: theme.spacing.xs,
          }}
        >
          {images.map((uri, index) => (
            <View
              key={uri}
              style={{
                width: index === activeIndex ? 18 : 6,
                height: 6,
                borderRadius: theme.radius.pill,
                backgroundColor:
                  index === activeIndex ? theme.colors.primary : theme.colors.surface,
              }}
            />
          ))}
        </View>
      ) : null}

      <ImageViewer
        visible={viewerIndex !== null}
        images={images}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
      />
    </View>
  );
}
