import type { TextStyle } from 'react-native';

/**
 * Typography tokens. The app is Arabic-first: body copy uses **Tajawal**,
 * display/headings use **Cairo**. Both ship four usable weights and cover Latin
 * too, so English localisation needs no font change.
 *
 * Font family strings match the keys passed to `useFonts()` in
 * `src/theme/fonts.ts`. Never set `fontSize` / `fontFamily` directly in a
 * component — pick a `typography.*` token via the `<Text variant>` prop.
 */

export const fontFamily = {
  bodyRegular: 'Tajawal_400Regular',
  bodyMedium: 'Tajawal_500Medium',
  bodyBold: 'Tajawal_700Bold',
  displayRegular: 'Cairo_400Regular',
  displaySemiBold: 'Cairo_600SemiBold',
  displayBold: 'Cairo_700Bold',
} as const;

export type FontFamilyToken = keyof typeof fontFamily;

export type TypographyVariant =
  | 'display'
  | 'heading'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodyMedium'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'overline';

type VariantStyle = Required<Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight'>> &
  Pick<TextStyle, 'letterSpacing' | 'textTransform'>;

export const typography: Record<TypographyVariant, VariantStyle> = {
  display: {
    fontFamily: fontFamily.displayBold,
    fontSize: 30,
    lineHeight: 40,
  },
  heading: {
    fontFamily: fontFamily.displayBold,
    fontSize: 24,
    lineHeight: 34,
  },
  title: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 20,
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 17,
    lineHeight: 26,
  },
  body: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 16,
    lineHeight: 26,
  },
  bodyMedium: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 16,
    lineHeight: 26,
  },
  bodyStrong: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 16,
    lineHeight: 26,
  },
  label: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  overline: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
};

/** Convenience aliases mirroring the brief's naming. */
export const textVariants = typography;
