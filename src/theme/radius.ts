/** Corner-radius scale. Cards and banners are softly rounded in the design language. */
export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radius;
