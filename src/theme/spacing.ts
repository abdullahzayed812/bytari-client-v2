/**
 * Spacing scale (4pt base). Use `theme.spacing.md` etc. — never a raw margin
 * number in a component. Generous by design (see the reference visuals).
 */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 56,
} as const;

export type SpacingToken = keyof typeof spacing;

/** Standard screen horizontal padding used by the layout primitives. */
export const screenPadding = spacing.xl;
