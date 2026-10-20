import { useCallback, useState } from 'react';
import { useWindowDimensions, type LayoutChangeEvent } from 'react-native';

/**
 * Responsive product grid of the store references: 3 compact cards per row on
 * a phone (the reference), more on tablets / desktop web. The container is
 * measured with `onLayout` (on the static web export `useWindowDimensions` is
 * 0×0 until hydration), falling back to the window width on native.
 */
export function useStoreGrid(opts: { gap?: number; padding?: number } = {}) {
  const gap = opts.gap ?? 8;
  const padding = opts.padding ?? 12;
  const { width: windowWidth } = useWindowDimensions();
  const [measured, setMeasured] = useState(0);
  const width = measured || windowWidth;

  const columns = width >= 1200 ? 6 : width >= 900 ? 5 : width >= 600 ? 4 : 3;
  const cardWidth =
    width > 0 ? Math.floor((width - padding * 2 - gap * (columns - 1)) / columns) : 0;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.width);
    setMeasured((prev) => (prev === next ? prev : next));
  }, []);

  return { onLayout, columns, cardWidth, gap, padding };
}
