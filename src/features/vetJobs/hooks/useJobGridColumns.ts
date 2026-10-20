import { useCallback, useState } from 'react';
import { useWindowDimensions, type LayoutChangeEvent } from 'react-native';

/**
 * Job lists ("عروض الوظائف" / "الباحثون عن عمل"): two columns when each card
 * still gets at least `minCardWidth`, one column on narrow phones. Measured
 * with `onLayout` (window width until then — 0 on the static web export).
 */
export function useJobGridColumns(minCardWidth: number, gap: number, padding: number) {
  const { width: windowWidth } = useWindowDimensions();
  const [measured, setMeasured] = useState(0);
  const width = measured || windowWidth;
  const columns: 1 | 2 = width > 0 && (width - padding * 2 - gap) / 2 >= minCardWidth ? 2 : 1;
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.width);
    setMeasured((prev) => (prev === next ? prev : next));
  }, []);
  return { columns, onLayout };
}
