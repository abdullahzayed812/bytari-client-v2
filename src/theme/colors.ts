/**
 * Colour tokens. Components must consume `theme.colors.*` — never hard-code a hex
 * value in a component. The light palette is authoritative; the dark palette is a
 * structural placeholder so a future dark theme is a token swap, not a refactor.
 */

/** Raw brand ramp — internal. Semantic tokens below are what components use. */
const palette = {
  green50: '#E6F7EE',
  green100: '#C6EED8',
  green200: '#9BE0BC',
  green300: '#63CE98',
  green400: '#2FBB78',
  green500: '#0BAA55', // primary brand green
  green600: '#099A4C',
  green700: '#077C3D',
  green800: '#065E2F',
  green900: '#043F20',

  white: '#FFFFFF',
  black: '#000000',

  gray0: '#FFFFFF',
  gray50: '#F7F9F8',
  gray100: '#EEF1F0',
  gray200: '#E2E7E5',
  gray300: '#CBD3D0',
  gray400: '#9AA5A1',
  gray500: '#6B7772',
  gray600: '#4B534F',
  gray700: '#343B38',
  gray800: '#232826',
  gray900: '#141716',

  red500: '#E5484D',
  red50: '#FCECEC',
  amber500: '#E0A100',
  amber50: '#FBF3DD',
  blue500: '#2E7DD1',
  blue50: '#E8F1FB',
} as const;

export interface ColorTokens {
  /** App background (screens). */
  background: string;
  /** Slightly raised surface (cards, sheets). */
  surface: string;
  /** Very light green secondary surface from the design language. */
  surfaceAccent: string;
  /** Inset / pressed surface. */
  surfaceMuted: string;

  border: string;
  borderStrong: string;
  divider: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  textLink: string;

  primary: string;
  primaryHover: string;
  primaryPressed: string;
  primarySoft: string;
  onPrimary: string;

  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;

  /** Bottom-nav specifics from the reference design. */
  tabBarBackground: string;
  tabBarChipBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  tabBarHomeButtonFrom: string;
  tabBarHomeButtonTo: string;
  tabBarHomeButtonRing: string;
  onTabBarHomeButton: string;

  overlay: string;
  skeleton: string;
  focusRing: string;
}

export const lightColors: ColorTokens = {
  background: palette.white,
  surface: palette.white,
  surfaceAccent: palette.green50,
  surfaceMuted: palette.gray50,

  border: palette.gray200,
  borderStrong: palette.gray300,
  divider: palette.gray100,

  textPrimary: palette.gray900,
  textSecondary: palette.gray600,
  textMuted: palette.gray400,
  textInverse: palette.white,
  textLink: palette.green600,

  primary: palette.green500,
  primaryHover: palette.green600,
  primaryPressed: palette.green700,
  primarySoft: palette.green50,
  onPrimary: palette.white,

  success: palette.green600,
  successSoft: palette.green50,
  warning: palette.amber500,
  warningSoft: palette.amber50,
  danger: palette.red500,
  dangerSoft: palette.red50,
  info: palette.blue500,
  infoSoft: palette.blue50,

  tabBarBackground: palette.gray50,
  tabBarChipBackground: palette.white,
  tabBarActive: palette.green500,
  tabBarInactive: palette.gray400,
  tabBarHomeButtonFrom: palette.green400,
  tabBarHomeButtonTo: palette.green600,
  tabBarHomeButtonRing: palette.gray50,
  onTabBarHomeButton: palette.white,

  overlay: 'rgba(20, 23, 22, 0.45)',
  skeleton: palette.gray100,
  focusRing: palette.green400,
};

/** Placeholder dark palette — not visually finished. Do not ship as the default. */
export const darkColors: ColorTokens = {
  background: palette.gray900,
  surface: palette.gray800,
  surfaceAccent: '#0E2A1C',
  surfaceMuted: palette.gray700,

  border: palette.gray700,
  borderStrong: palette.gray600,
  divider: palette.gray800,

  textPrimary: palette.gray50,
  textSecondary: palette.gray300,
  textMuted: palette.gray500,
  textInverse: palette.gray900,
  textLink: palette.green300,

  primary: palette.green400,
  primaryHover: palette.green300,
  primaryPressed: palette.green200,
  primarySoft: '#0E2A1C',
  onPrimary: palette.gray900,

  success: palette.green400,
  successSoft: '#0E2A1C',
  warning: palette.amber500,
  warningSoft: '#3A2E05',
  danger: palette.red500,
  dangerSoft: '#3A1214',
  info: palette.blue500,
  infoSoft: '#0C2438',

  tabBarBackground: palette.gray800,
  tabBarChipBackground: palette.gray700,
  tabBarActive: palette.green400,
  tabBarInactive: palette.gray500,
  tabBarHomeButtonFrom: palette.green300,
  tabBarHomeButtonTo: palette.green500,
  tabBarHomeButtonRing: palette.gray800,
  onTabBarHomeButton: palette.gray900,

  overlay: 'rgba(0, 0, 0, 0.6)',
  skeleton: palette.gray700,
  focusRing: palette.green300,
};

export const colorSchemes = { light: lightColors, dark: darkColors } as const;
export type ColorSchemeName = keyof typeof colorSchemes;
export { palette as rawPalette };
