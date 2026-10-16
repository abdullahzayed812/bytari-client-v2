import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import i18n from 'i18next';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/typography';
import { physicalLeft } from '@/lib/rtl';

import splashBackground from '../../../assets/splash-bg.png';
import splashGlow from '../../../assets/splash-glow.png';
import splashLogo from '../../../assets/splash-logo.png';

/**
 * Brand splash (web + native), a 1:1 port of the supplied `سبلاش.html`
 * reference: radial mint background, a pulsing green glow and two ripple
 * rings behind the logo, the logo popping in then "breathing", the tagline,
 * and an indeterminate progress bar + three pulsing dots at the bottom.
 *
 * Colours / sizes / timings are the reference's own (it is a fixed-palette
 * brand screen, light in both themes). Radial gradients have no RN
 * primitive, so the background and glow are pre-rendered PNGs
 * (`assets/splash-bg.png`, `assets/splash-glow.png`) laid out so their
 * circles stay circular at any aspect ratio.
 *
 * Rendered by `app/_layout.tsx` until bootstrap is done AND
 * `SPLASH_MIN_DURATION_MS` has elapsed.
 */
export const SPLASH_MIN_DURATION_MS = 3000;

const C = {
  base: '#e1f4ee',
  ring: 'rgba(16, 185, 129, 0.2)',
  tagline: '#1a6b63',
  track: 'rgba(13, 148, 136, 0.12)',
  dot: '#10b981',
  indicator: ['#10b981', '#0d9488', '#059669'] as const,
};

/** Shown before i18n is initialised (Arabic is the default language). */
const TAGLINE_FALLBACK = 'رعاية بيطرية متكاملة بلمسة واحدة';
const LOGO_ASPECT = 351 / 512;
/** The glow PNG is 620 logical px: a 380px circle + 3σ of its 40px blur each side. */
const GLOW_SIZE = 620;
const RING_SIZE = 260;
const TRACK_MAX = 260;

const native = Platform.OS !== 'web';

function useLoop(build: (v: Animated.Value) => Animated.CompositeAnimation, initial = 0) {
  const value = useRef(new Animated.Value(initial)).current;
  useEffect(() => {
    const anim = build(value);
    anim.start();
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

const timing = (
  v: Animated.Value,
  toValue: number,
  duration: number,
  easing: (t: number) => number,
  useNativeDriver = native,
) => Animated.timing(v, { toValue, duration, easing, useNativeDriver });

export function AppSplash() {
  const insets = useSafeAreaInsets();
  // Measured, not `useWindowDimensions()`: on the statically pre-rendered web
  // page that hook reports 0×0 and never catches up after hydration.
  // Web starts at 0×0 so the first client render matches the static HTML
  // (no hydration mismatch); `onLayout` then supplies the real size.
  const [{ width, height }, setSize] = useState(() => {
    if (Platform.OS === 'web') return { width: 0, height: 0 };
    const win = Dimensions.get('window');
    return { width: win.width, height: win.height };
  });
  const [trackWidth, setTrackWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w !== width || h !== height) setSize({ width: w, height: h });
  };
  const measured = width > 0 && height > 0;

  const tagline = i18n.isInitialized
    ? i18n.t('common:splashTagline', { defaultValue: TAGLINE_FALLBACK })
    : TAGLINE_FALLBACK;

  // body: radial-gradient(circle at 50% 40%, …) — 100% = farthest corner.
  const bgRadius = Math.hypot(width / 2, height * 0.6);
  const logoWidth = measured ? Math.min(210, width * 0.8) : 210;

  // .logo-wrapper entrancePop: 1.1s cubic-bezier(0.16, 1, 0.3, 1).
  const entrance = useLoop((v) => timing(v, 1, 1100, Easing.bezier(0.16, 1, 0.3, 1)));
  // .logo-floating floatBreath: 3.8s ease-in-out infinite, after 1.1s.
  const breath = useLoop((v) =>
    Animated.sequence([
      Animated.delay(1100),
      Animated.loop(
        Animated.sequence([
          timing(v, 1, 1900, Easing.inOut(Easing.ease)),
          timing(v, 0, 1900, Easing.inOut(Easing.ease)),
        ]),
      ),
    ]),
  );
  // .ambient-glow glowPulse: 4s ease-in-out infinite alternate.
  const glow = useLoop((v) =>
    Animated.loop(
      Animated.sequence([
        timing(v, 1, 4000, Easing.inOut(Easing.ease)),
        timing(v, 0, 4000, Easing.inOut(Easing.ease)),
      ]),
    ),
  );
  // .pulse-ring ripple: 3s cubic-bezier(0.2, 0.8, 0.4, 1) infinite; 2nd ring +1.2s.
  const ripple = (delay: number) => (v: Animated.Value) =>
    Animated.sequence([
      Animated.delay(delay),
      Animated.loop(timing(v, 1, 3000, Easing.bezier(0.2, 0.8, 0.4, 1))),
    ]);
  const ring1 = useLoop(ripple(0));
  const ring2 = useLoop(ripple(1200));
  // .tagline / .bottom-section fadeInText: 0.9s ease-out, after 0.8s / 0.9s.
  const fadeIn = (delay: number) => (v: Animated.Value) =>
    Animated.sequence([Animated.delay(delay), timing(v, 1, 900, Easing.out(Easing.ease))]);
  const taglineIn = useLoop(fadeIn(800));
  const bottomIn = useLoop(fadeIn(900));
  // .progress-indicator loadingSlide: 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite.
  // Animates `width`, so it runs on the JS driver.
  const progress = useLoop((v) =>
    Animated.loop(timing(v, 1, 2200, Easing.bezier(0.4, 0, 0.2, 1), false)),
  );
  // .dot dotPulse: 1.4s ease-in-out infinite; delays 0 / 0.2s / 0.4s.
  const dotPulse = (delay: number) => (v: Animated.Value) =>
    Animated.sequence([
      Animated.delay(delay),
      Animated.loop(
        Animated.sequence([
          timing(v, 1, 700, Easing.inOut(Easing.ease)),
          timing(v, 0, 700, Easing.inOut(Easing.ease)),
        ]),
      ),
    ]);
  const dots = [useLoop(dotPulse(0)), useLoop(dotPulse(200)), useLoop(dotPulse(400))];

  const rippleStyle = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.6] }) }],
  });
  const fadeInStyle = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  });

  return (
    <View
      accessible
      accessibilityLabel={tagline}
      onLayout={onLayout}
      style={{ flex: 1, backgroundColor: C.base, overflow: 'hidden' }}
    >
      {measured ? (
        <>
          <Image
            source={splashBackground}
            contentFit="fill"
            style={{
              position: 'absolute',
              width: bgRadius * 2,
              height: bgRadius * 2,
              left: width / 2 - bgRadius,
              top: height * 0.4 - bgRadius,
            }}
            accessibilityIgnoresInvertColors
          />

          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: GLOW_SIZE,
              height: GLOW_SIZE,
              left: width / 2 - GLOW_SIZE / 2,
              top: height * 0.45 - GLOW_SIZE / 2,
              opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0.95] }),
              transform: [
                { scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] }) },
              ],
            }}
          >
            <Image
              source={splashGlow}
              contentFit="fill"
              style={StyleSheet.absoluteFill}
              accessibilityIgnoresInvertColors
            />
          </Animated.View>

          {[ring1, ring2].map((v, i) => (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  width: RING_SIZE,
                  height: RING_SIZE,
                  left: width / 2 - RING_SIZE / 2,
                  top: height * 0.43 - RING_SIZE / 2,
                  borderRadius: RING_SIZE / 2,
                  borderWidth: 1.5,
                  borderColor: C.ring,
                },
                rippleStyle(v),
              ]}
            />
          ))}
        </>
      ) : null}

      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 430,
          alignSelf: 'center',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}
      >
        {/* .center-stage — `margin: auto 0` centres it in the free space. */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Animated.View
            style={{
              opacity: entrance.interpolate({
                inputRange: [0, 0.7, 1],
                outputRange: [0, 1, 1],
              }),
              transform: [
                {
                  scale: entrance.interpolate({
                    inputRange: [0, 0.7, 1],
                    outputRange: [0.65, 1.03, 1],
                  }),
                },
                {
                  translateY: entrance.interpolate({
                    inputRange: [0, 0.7, 1],
                    outputRange: [25, -3, 0],
                  }),
                },
              ],
            }}
          >
            <Animated.View
              style={{
                transform: [
                  { translateY: breath.interpolate({ inputRange: [0, 1], outputRange: [0, -9] }) },
                  { scale: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) },
                ],
              }}
            >
              <Image
                source={splashLogo}
                contentFit="contain"
                style={[
                  { width: logoWidth, height: logoWidth / LOGO_ASPECT },
                  // filter: drop-shadow(0 14px 28px rgba(13, 79, 70, 0.14))
                  Platform.OS === 'web'
                    ? ({ filter: 'drop-shadow(0 14px 28px rgba(13, 79, 70, 0.14))' } as object)
                    : null,
                ]}
                accessibilityIgnoresInvertColors
              />
            </Animated.View>
          </Animated.View>

          <Animated.View style={[{ marginTop: 18 }, fadeInStyle(taglineIn)]}>
            {/* The reference's exact type spec (15px / 500 / 0.3 letter-spacing). */}
            <Text
              weight="medium"
              center
              style={{ fontSize: 15, lineHeight: 22, letterSpacing: 0.3, color: C.tagline }}
            >
              {tagline}
            </Text>
          </Animated.View>
        </View>

        {/* .bottom-section */}
        <Animated.View
          style={[
            { width: '100%', maxWidth: TRACK_MAX, alignItems: 'center', rowGap: 14 },
            fadeInStyle(bottomIn),
          ]}
        >
          <View
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
            style={{
              width: '100%',
              height: 4,
              borderRadius: 999,
              backgroundColor: C.track,
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                // The reference animates physical `left`; translateX is physical on
                // web AND native RTL (where `left` is swapped), so the bar runs
                // left → right in both languages.
                ...physicalLeft(0),
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [-0.35 * trackWidth, 0.25 * trackWidth, trackWidth],
                    }),
                  },
                ],
                width: progress.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.35 * trackWidth, 0.6 * trackWidth, 0.35 * trackWidth],
                }),
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <LinearGradient
                colors={C.indicator}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
            {dots.map((v, i) => (
              <Animated.View
                key={i}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: C.dot,
                  opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
                  transform: [
                    { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.3] }) },
                  ],
                }}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
