import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { ClinicCard } from '@/features/organizations/components/ClinicCard';
import type { PublicOrganization } from '@/features/organizations/types';
import { isRTL } from '@/lib/rtl';
import { useTheme } from '@/theme';

const AUTO_ADVANCE_MS = 4000;
/** After a manual swipe / dot tap, wait this long before auto-advancing again. */
const RESUME_AFTER_MS = 6000;
const GAP = 12;

/**
 * Horizontal, auto-advancing carousel of clinic / veterinary-office cards
 * (home pages), like the ad carousel: swipe or tap a dot to navigate, the
 * timer pauses while the user interacts. Cards are the directory `ClinicCard`
 * (logo, name on up to two lines — never clipped to one, type label, address,
 * phone, rating); several fit side by side on wide screens.
 *
 * Scroll math runs in a forced-LTR subtree (horizontal RTL scrolling is buggy
 * in RN — see `Advertisement`); in RTL the order is mirrored and the strip
 * starts at the right end, so it reads and advances right-to-left, and each
 * card restores the app direction for its own content.
 */
export function OrganizationsCarousel({
  organizations,
  onPressOrganization,
}: {
  organizations: PublicOrganization[];
  onPressOrganization: (organization: PublicOrganization) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('home');
  const rtl = isRTL();
  const count = organizations.length;

  const { width: windowWidth } = useWindowDimensions();
  const [measured, setMeasured] = useState(0);
  // Window width (minus the screen gutters) until the strip is measured; the
  // static web export reports 0 there, so it simply renders after layout.
  const width = measured || Math.max(0, windowWidth - theme.screenPadding * 2);
  const cardWidth =
    width >= 900
      ? Math.floor((width - GAP * 2) / 3)
      : width >= 600
        ? Math.floor((width - GAP) / 2)
        : Math.floor(Math.min(width * 0.86, 380));
  const step = cardWidth + GAP;
  const visible = cardWidth > 0 ? Math.max(1, Math.floor((width + GAP) / step)) : 1;
  /** Last logical index worth scrolling to (the rest are already on screen). */
  const lastIndex = Math.max(0, count - visible);

  const listRef = useRef<ScrollView>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const pausedUntil = useRef(0);

  const offsetFor = useCallback(
    (index: number) => {
      const contentWidth = count * step - GAP;
      const maxX = Math.max(0, contentWidth - width);
      const x = rtl ? maxX - index * step : index * step;
      return Math.min(maxX, Math.max(0, x));
    },
    [count, step, width, rtl],
  );

  const goTo = useCallback(
    (index: number, animated = true) => {
      const clamped = Math.min(lastIndex, Math.max(0, index));
      activeRef.current = clamped;
      setActive(clamped);
      listRef.current?.scrollTo({ x: offsetFor(clamped), animated });
    },
    [lastIndex, offsetFor],
  );

  // Start at the reading start (the right end in RTL) once measured.
  useEffect(() => {
    if (width > 0) goTo(Math.min(activeRef.current, lastIndex), false);
  }, [width, lastIndex, goTo]);

  useEffect(() => {
    if (lastIndex === 0) return undefined;
    const id = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      goTo(activeRef.current >= lastIndex ? 0 : activeRef.current + 1);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [lastIndex, goTo]);

  const pause = (): void => {
    pausedUntil.current = Date.now() + RESUME_AFTER_MS;
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const x = e.nativeEvent.contentOffset.x;
    let best = 0;
    for (let i = 0; i <= lastIndex; i += 1) {
      if (Math.abs(offsetFor(i) - x) < Math.abs(offsetFor(best) - x)) best = i;
    }
    activeRef.current = best;
    setActive(best);
  };

  const onLayout = (e: LayoutChangeEvent): void => {
    const next = Math.round(e.nativeEvent.layout.width);
    setMeasured((prev) => (prev === next ? prev : next));
  };

  const ordered = rtl ? [...organizations].reverse() : organizations;

  return (
    <View onLayout={onLayout} style={{ rowGap: theme.spacing.sm }}>
      {width > 0 ? (
        <View style={{ direction: 'ltr' }}>
          <ScrollView
            ref={listRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={step}
            snapToAlignment="start"
            decelerationRate="fast"
            onScrollBeginDrag={pause}
            onMomentumScrollEnd={onMomentumEnd}
            contentContainerStyle={{ columnGap: GAP, alignItems: 'stretch' }}
          >
            {ordered.map((org) => (
              <View
                key={org.id}
                style={{ width: cardWidth, direction: rtl ? 'rtl' : 'ltr', flexDirection: 'row' }}
              >
                <ClinicCard
                  organization={org}
                  width="100%"
                  showType
                  // Long clinic / office names wrap instead of being cut short.
                  nameLines={3}
                  onPress={() => onPressOrganization(org)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {lastIndex > 0 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'center', columnGap: 6 }}>
          {Array.from({ length: lastIndex + 1 }, (_, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={t('featured.goTo', { index: i + 1, count: lastIndex + 1 })}
              accessibilityState={{ selected: i === active }}
              hitSlop={8}
              onPress={() => {
                pause();
                goTo(i);
              }}
            >
              <View
                style={{
                  width: i === active ? 18 : 6,
                  height: 6,
                  borderRadius: theme.radius.pill,
                  backgroundColor: i === active ? theme.colors.primary : theme.colors.border,
                }}
              />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
