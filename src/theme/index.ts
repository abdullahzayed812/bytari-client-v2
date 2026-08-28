import { colorSchemes, type ColorSchemeName, type ColorTokens } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { sizes } from './sizes';
import { screenPadding, spacing } from './spacing';
import { fontFamily, typography } from './typography';
import { zIndex } from './zIndex';

export interface Theme {
  scheme: ColorSchemeName;
  colors: ColorTokens;
  spacing: typeof spacing;
  screenPadding: number;
  radius: typeof radius;
  shadows: typeof shadows;
  sizes: typeof sizes;
  zIndex: typeof zIndex;
  typography: typeof typography;
  fontFamily: typeof fontFamily;
}

export function buildTheme(scheme: ColorSchemeName): Theme {
  return {
    scheme,
    colors: colorSchemes[scheme],
    spacing,
    screenPadding,
    radius,
    shadows,
    sizes,
    zIndex,
    typography,
    fontFamily,
  };
}

/** Default (light) theme — used as the SSR/initial value and in tests. */
export const defaultTheme: Theme = buildTheme('light');

export * from './colors';
export * from './spacing';
export * from './radius';
export * from './shadows';
export * from './sizes';
export * from './zIndex';
export * from './typography';
export { ThemeProvider, useTheme, useThemedStyles } from './ThemeProvider';
