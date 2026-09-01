import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  useWindowDimensions,
  View,
  type ViewToken,
} from 'react-native';

import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { useHomeAds } from '../hooks';
import type { HomeAd } from '../types';

const CARD_ASPECT_RATIO = 1200 / 560;
const AUTO_SLIDE_INTERVAL_MS = 5000;

/**
 * The Home banner carousel — one admin-curated ad per page, auto-advancing,
 * with pagination dots. Renders nothing when there are no active ads (no
 * empty state — an empty carousel just isn't shown, matching an ordinary
 * promo slot rather than a content list).
 *
 * The active index is tracked via `onViewableItemsChanged` rather than
 * `contentOffset.x / cardWidth` — in this RTL app a manual pixel-offset
 * calculation disagrees with which item is actually on screen, which showed
 * up as the dots moving opposite to the real swipe direction. Viewability
 * tracking asks FlatList which item is actually visible, so it's correct
 * regardless of layout direction. `scrollToIndex` (with `getItemLayout`) is
 * used for the same reason — it lets FlatList resolve the real scroll
 * offset for that index instead of us computing one by hand.
 */
export function HomeAdsCarousel() {
  const theme = useTheme();
  const { t } = useTranslation('home');
  const { width } = useWindowDimensions();
  const { data: ads } = useHomeAds();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<HomeAd>>(null);
  const activeIndexRef = useRef(0);

  const cardWidth = width - theme.screenPadding * 2;
  const cardHeight = cardWidth / CARD_ASPECT_RATIO;

  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 60 });
  const onViewableItemsChangedRef = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (typeof first?.index === 'number') {
        activeIndexRef.current = first.index;
        setActiveIndex(first.index);
      }
    },
  );

  const adCount = ads?.length ?? 0;

  // Auto-advance. Reads activeIndexRef fresh each tick, so a manual swipe
  // (which onViewableItemsChanged keeps in sync) is always the base for the
  // next automatic step, not a stale closed-over value.
  useEffect(() => {
    if (adCount <= 1) return;
    const id = setInterval(() => {
      const next = (activeIndexRef.current + 1) % adCount;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      activeIndexRef.current = next;
      setActiveIndex(next);
    }, AUTO_SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [adCount]);

  if (!ads || ads.length === 0) return null;

  return (
    <View style={{ rowGap: theme.spacing.sm }}>
      <FlatList
        ref={listRef}
        data={ads}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: cardWidth, offset: cardWidth * index, index })}
        viewabilityConfig={viewabilityConfigRef.current}
        onViewableItemsChanged={onViewableItemsChangedRef.current}
        onScrollToIndexFailed={({ index }) =>
          listRef.current?.scrollToOffset({ offset: index * cardWidth, animated: true })
        }
        renderItem={({ item }) => (
          <View
            style={{
              width: cardWidth,
              height: cardHeight,
              borderRadius: theme.radius.xl,
              overflow: 'hidden',
              backgroundColor: theme.colors.surfaceMuted,
            }}
          >
            <Image
              source={item.imageUrl ?? undefined}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              accessibilityIgnoresInvertColors
              accessible
              accessibilityLabel={t('ads.a11y', { title: item.title })}
            />
            <LinearGradient
              colors={['rgba(6,20,13,0)', 'rgba(6,20,13,0.75)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              locations={[0.35, 1]}
              style={{ position: 'absolute', top: 0, bottom: 0, start: 0, end: 0 }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                start: 0,
                end: 0,
                padding: theme.spacing.lg,
                rowGap: theme.spacing.xs,
              }}
            >
              <Text variant="title" weight="bold" style={{ color: theme.colors.textInverse }}>
                {item.title}
              </Text>
              {item.subtitle ? (
                <Text variant="bodyMedium" style={{ color: theme.colors.textInverse }}>
                  {item.subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        )}
      />

      {ads.length > 1 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'center', columnGap: theme.spacing.xs }}>
          {ads.map((ad, index) => (
            <View
              key={ad.id}
              style={{
                width: index === activeIndex ? 18 : 6,
                height: 6,
                borderRadius: theme.radius.pill,
                backgroundColor:
                  index === activeIndex ? theme.colors.primary : theme.colors.border,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
