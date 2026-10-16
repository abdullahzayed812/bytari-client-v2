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

/**
 * Cairo's glyphs overflow a tight line box. Its font box is 1.874em
 * (hhea ascent 1.303 / descent 0.571), so with our display/heading/title
 * line heights (~1.33–1.5em) Android, iOS and web all apply NEGATIVE
 * half-leading (CSS inline model) and the text view's bounds end ~0.3em
 * below the baseline — but the dots of ي reach 0.462em (Cairo Bold, the
 * lowest glyph) and tall marks reach 1.092em above it. Views clip their
 * own drawing, so those pixels vanish (a margin can't help; it's outside).
 *
 * `cairoGlyphPadding` returns the padding that brings the bounds out to the
 * real glyph extents, keeping the designed line spacing:
 *   effective descent = 0.571s + (lh − 1.874s) / 2  →  bottom = 0.828s − lh/2
 *   effective ascent  = 1.303s + (lh − 1.874s) / 2  →  top    = 0.726s − lh/2
 * (+1px for the integer rounding of font metrics). Tajawal (body) fits.
 */
const CAIRO_OVERFLOW = { bottom: 0.828, top: 0.726 } as const;

export function cairoGlyphPadding(
  fontSize: number,
  lineHeight: number,
): { paddingTop: number; paddingBottom: number } | null {
  const pad = (em: number) => {
    const px = em * fontSize - lineHeight / 2;
    return px > 0 ? Math.ceil(px) + 1 : 0;
  };
  const paddingTop = pad(CAIRO_OVERFLOW.top);
  const paddingBottom = pad(CAIRO_OVERFLOW.bottom);
  return paddingTop || paddingBottom ? { paddingTop, paddingBottom } : null;
}

/** Convenience aliases mirroring the brief's naming. */
export const textVariants = typography;
