import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StatusBar, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/content';
import { Caption } from '@/components/typography';
import { useTheme } from '@/theme';

export interface ImageViewerProps {
  visible: boolean;
  images: string[];
  /** Which image to open on, if the caller tapped a specific thumbnail. */
  initialIndex?: number;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const SWIPE_THRESHOLD = 80;

/**
 * Full-screen photo lightbox — pinch/double-tap to zoom, pan to move while
 * zoomed, swipe (or the arrow buttons) to move between images while at rest.
 * No dedicated gallery/lightbox package was in the app, so this is hand-rolled
 * on top of the already-installed `react-native-gesture-handler` +
 * `react-native-reanimated` (no new native dependency needed).
 */
export function ImageViewer({ visible, images, initialIndex = 0, onClose }: ImageViewerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (visible) setIndex(initialIndex);
  }, [visible, initialIndex]);

  const goTo = (next: number) => {
    if (next < 0 || next >= images.length) return;
    setIndex(next);
  };

  if (images.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" />
      {/*
        A React Native `Modal` renders into its own native view hierarchy, so the
        app-root `GestureHandlerRootView` (AppProviders) does NOT reach inside it
        on Android — without this wrapper the pinch / pan / double-tap gestures
        below silently do nothing there. Cheap and harmless on iOS/web.
      */}
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: 'black' }}>
        <ZoomableImage
          key={index}
          uri={images[Math.min(index, images.length - 1)] as string}
          width={width}
          height={height}
          onSwipeLeft={() => goTo(index + 1)}
          onSwipeRight={() => goTo(index - 1)}
        />

        <View
          style={{
            position: 'absolute',
            top: insets.top + theme.spacing.sm,
            insetInlineStart: theme.spacing.md,
            insetInlineEnd: theme.spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <OverlayIconButton icon="close" accessibilityLabel="Close" onPress={onClose} />
          {images.length > 1 ? (
            <Caption style={{ color: theme.colors.textInverse }}>
              {index + 1} / {images.length}
            </Caption>
          ) : null}
          <View style={{ width: theme.sizes.touchTarget }} />
        </View>

        {images.length > 1 ? (
          <View
            style={{
              position: 'absolute',
              top: '50%',
              insetInlineStart: theme.spacing.sm,
              insetInlineEnd: theme.spacing.sm,
              flexDirection: 'row',
              justifyContent: 'space-between',
              transform: [{ translateY: -20 }],
            }}
          >
            <OverlayIconButton
              icon="chevron-back"
              accessibilityLabel="Previous image"
              directional
              disabled={index === 0}
              onPress={() => goTo(index - 1)}
            />
            <OverlayIconButton
              icon="chevron-forward"
              accessibilityLabel="Next image"
              directional
              disabled={index === images.length - 1}
              onPress={() => goTo(index + 1)}
            />
          </View>
        ) : null}
      </GestureHandlerRootView>
    </Modal>
  );
}

/** A translucent-dark circular button, legible over any photo. */
function OverlayIconButton({
  icon,
  accessibilityLabel,
  directional,
  disabled,
  onPress,
}: {
  icon: IconName;
  accessibilityLabel: string;
  directional?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: theme.sizes.touchTarget,
          height: theme.sizes.touchTarget,
          borderRadius: theme.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.45)',
        },
        pressed && { opacity: 0.7 },
        disabled && { opacity: 0.35 },
      ]}
    >
      <Icon name={icon} size="iconMd" color="textInverse" directional={directional} />
    </Pressable>
  );
}

function ZoomableImage({
  uri,
  width,
  height,
  onSwipeLeft,
  onSwipeRight,
}: {
  uri: string;
  width: number;
  height: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetZoom = () => {
    'worklet';
    scale.value = withSpring(MIN_SCALE);
    savedScale.value = MIN_SCALE;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= MIN_SCALE) resetZoom();
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (savedScale.value > MIN_SCALE) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      } else {
        translateX.value = e.translationX;
      }
    })
    .onEnd((e) => {
      if (savedScale.value > MIN_SCALE) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
        return;
      }
      translateX.value = withSpring(0);
      if (e.translationX <= -SWIPE_THRESHOLD) onSwipeLeft();
      else if (e.translationX >= SWIPE_THRESHOLD) onSwipeRight();
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (savedScale.value > MIN_SCALE) {
        resetZoom();
      } else {
        scale.value = withSpring(DOUBLE_TAP_SCALE);
        savedScale.value = DOUBLE_TAP_SCALE;
      }
    });

  const composed = Gesture.Exclusive(doubleTap, Gesture.Simultaneous(pinch, pan));

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[{ width, height, alignItems: 'center', justifyContent: 'center' }, style]}>
        <Image source={{ uri }} style={{ width, height }} contentFit="contain" />
      </Animated.View>
    </GestureDetector>
  );
}
