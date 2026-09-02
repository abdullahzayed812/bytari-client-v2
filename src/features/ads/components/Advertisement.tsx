import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, useWindowDimensions, View, type ViewToken } from 'react-native';

import { Icon } from '@/components/content';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { useAds } from '../hooks';
import type { AdPlacement, AdSlide } from '../types';

const CARD_ASPECT_RATIO = 1200 / 560;
const AUTO_SLIDE_INTERVAL_MS = 5000;

interface AdvertisementProps {
  /** The screen this slot belongs to. The backend decides what (and how) to render. */
  placement: AdPlacement;
}

/**
 * The one reusable advertisement slot. A screen only declares its placement:
 *
 *   <Advertisement placement="PETS" />
 *
 * It fetches `GET /ads?placement=…` and renders the placement's slides (from
 * every eligible campaign, in backend order) as **one** unit: a single banner
 * when there is exactly one slide, otherwise a single auto-advancing carousel
 * with pagination dots — never a vertical stack. Each slide carries its own
 * image / title / subtitle / CTA. Renders nothing when there are no eligible
 * ads (an empty promo slot, not an empty state).
 */
export function Advertisement({ placement }: AdvertisementProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { data: campaigns } = useAds(placement);

  const slides: AdSlide[] = campaigns?.flatMap((c) => c.slides) ?? [];
  if (slides.length === 0) return null;

  const cardWidth = width - theme.screenPadding * 2;

  if (slides.length === 1) {
    return <SlideView slide={slides[0]!} width={cardWidth} />;
  }
  return <AdCarousel slides={slides} cardWidth={cardWidth} />;
}

function onPressCta(url: string): void {
  if (url.startsWith('/')) {
    router.push(url as Parameters<typeof router.push>[0]);
    return;
  }
  void Linking.openURL(url).catch(() => undefined);
}

function SlideView({ slide, width }: { slide: AdSlide; width: number }) {
  const theme = useTheme();
  const { t } = useTranslation('home');
  const height = width / CARD_ASPECT_RATIO;
  const hasCta = Boolean(slide.ctaLabel && slide.ctaUrl);

  return (
    <View
      style={{
        width,
        height,
        borderRadius: theme.radius.xl,
        overflow: 'hidden',
        backgroundColor: theme.colors.surfaceMuted,
      }}
    >
      <Image
        source={slide.imageUrl ?? undefined}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        accessibilityIgnoresInvertColors
        accessible
        accessibilityLabel={t('ads.a11y', { title: slide.title ?? '' })}
      />
      <LinearGradient
        colors={['rgba(6,20,13,0)', 'rgba(6,20,13,0.75)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0.35, 1]}
        style={{ position: 'absolute', top: 0, bottom: 0, start: 0, end: 0 }}
      />
      {slide.title || slide.subtitle || hasCta ? (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            start: 0,
            end: 0,
            padding: theme.spacing.lg,
            rowGap: theme.spacing.sm,
            alignItems: 'flex-start',
          }}
        >
          {slide.title ? (
            <Text variant="title" weight="bold" style={{ color: theme.colors.textInverse }}>
              {slide.title}
            </Text>
          ) : null}
          {slide.subtitle ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.textInverse }}>
              {slide.subtitle}
            </Text>
          ) : null}
          {hasCta ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={slide.ctaLabel as string}
              onPress={() => onPressCta(slide.ctaUrl as string)}
              style={({ pressed }) => [
                {
                  marginTop: theme.spacing.xs,
                  flexDirection: 'row',
                  alignItems: 'center',
                  columnGap: theme.spacing.sm,
                  paddingVertical: theme.spacing.sm,
                  paddingHorizontal: theme.spacing.lg,
                  borderRadius: theme.radius.pill,
                  backgroundColor: theme.colors.surface,
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text variant="label" style={{ color: theme.colors.textPrimary }}>
                {slide.ctaLabel}
              </Text>
              <Icon name="arrow-forward" size="iconXs" color="textPrimary" directional />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function AdCarousel({ slides, cardWidth }: { slides: AdSlide[]; cardWidth: number }) {
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const listRef = useRef<FlatList<AdSlide>>(null);
  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 60 });
  const onViewableItemsChangedRef = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (typeof first?.index === 'number') {
      activeIndexRef.current = first.index;
      setActiveIndex(first.index);
    }
  });

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      const next = (activeIndexRef.current + 1) % slides.length;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      activeIndexRef.current = next;
      setActiveIndex(next);
    }, AUTO_SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <View style={{ rowGap: theme.spacing.sm }}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: cardWidth, offset: cardWidth * index, index })}
        viewabilityConfig={viewabilityConfigRef.current}
        onViewableItemsChanged={onViewableItemsChangedRef.current}
        onScrollToIndexFailed={({ index }) =>
          listRef.current?.scrollToOffset({ offset: index * cardWidth, animated: true })
        }
        renderItem={({ item }) => <SlideView slide={item} width={cardWidth} />}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'center', columnGap: theme.spacing.xs }}>
        {slides.map((s, index) => (
          <View
            key={s.id}
            style={{
              width: index === activeIndex ? 18 : 6,
              height: 6,
              borderRadius: theme.radius.pill,
              backgroundColor: index === activeIndex ? theme.colors.primary : theme.colors.border,
            }}
          />
        ))}
      </View>
    </View>
  );
}
