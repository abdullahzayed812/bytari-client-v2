import { Platform, type ViewStyle } from 'react-native';

/**
 * Soft, subtle elevations. Cross-platform: iOS shadow props + Android
 * `elevation`. Use `theme.shadows.card` etc. rather than inline shadow props.
 */
type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

function make(elevation: number, opacity: number, radius: number, y: number): ShadowStyle {
  return Platform.select<ShadowStyle>({
    ios: {
      shadowColor: '#0B1F16',
      shadowOffset: { width: 0, height: y },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: { elevation },
    default: {},
  }) as ShadowStyle;
}

export const shadows = {
  none: make(0, 0, 0, 0),
  xs: make(1, 0.04, 3, 1),
  card: make(3, 0.06, 10, 4),
  raised: make(6, 0.1, 18, 8),
  overlay: make(12, 0.16, 28, 12),
} as const;

export type ShadowToken = keyof typeof shadows;
