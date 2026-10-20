import { useState, type ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { useTheme } from '@/theme';

import { Skeleton } from '../feedback/Skeleton';

const GAP = 8;
export const THREE_UP_COUNT = 3;

/**
 * Exactly three cards side by side (the home-page previews of news / tips /
 * office products), sized from the measured row width so they fit every
 * screen without horizontal scrolling. Shows three skeletons while loading
 * and `empty` when there is nothing.
 */
export function ThreeUpRow<T>({
  items,
  loading,
  empty,
  keyOf,
  renderItem,
  skeletonHeight = 190,
}: {
  items: T[];
  loading: boolean;
  empty: ReactNode;
  keyOf: (item: T) => string;
  renderItem: (item: T, width: number) => ReactNode;
  skeletonHeight?: number;
}) {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [measured, setWidth] = useState(0);
  // Window width minus the gutters until measured (0 on the static web export).
  const width = measured || Math.max(0, windowWidth - theme.screenPadding * 2);
  const cardWidth =
    width > 0 ? Math.floor((width - GAP * (THREE_UP_COUNT - 1)) / THREE_UP_COUNT) : 0;

  return (
    <View
      onLayout={(e) => {
        const next = Math.round(e.nativeEvent.layout.width);
        setWidth((prev) => (prev === next ? prev : next));
      }}
    >
      {!loading && items.length === 0 ? (
        empty
      ) : cardWidth === 0 ? null : (
        <View style={{ flexDirection: 'row', columnGap: GAP, alignItems: 'stretch' }}>
          {loading
            ? Array.from({ length: THREE_UP_COUNT }, (_, i) => (
                <Skeleton key={i} width={cardWidth} height={skeletonHeight} radius={12} />
              ))
            : items.slice(0, THREE_UP_COUNT).map((item) => (
                <View key={keyOf(item)} style={{ width: cardWidth, flexDirection: 'row' }}>
                  {renderItem(item, cardWidth)}
                </View>
              ))}
        </View>
      )}
    </View>
  );
}
