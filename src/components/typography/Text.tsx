import { forwardRef } from 'react';
import {
  Text as RNText,
  StyleSheet,
  useWindowDimensions,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native';

import { writingDirection } from '@/lib/rtl';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/colors';
import { cairoGlyphPadding, type TypographyVariant } from '@/theme/typography';

type ColorRole = keyof Pick<
  ColorTokens,
  | 'textPrimary'
  | 'textSecondary'
  | 'textMuted'
  | 'textInverse'
  | 'textLink'
  | 'primary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info'
>;

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: ColorRole;
  align?: TextStyle['textAlign'];
  weight?: 'regular' | 'medium' | 'bold';
  center?: boolean;
}

const MAX_FONT_SCALE = 1.6;

/**
 * The only text primitive. Always renders with an Arabic-capable font and the
 * correct writing direction. Never set `fontSize`/`fontFamily` directly — pass a
 * `variant`.
 */
export const Text = forwardRef<RNText, TextProps>(function Text(
  { variant = 'body', color = 'textPrimary', align, weight, center, style, ...rest },
  ref,
) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const base = theme.typography[variant];

  const fontFamily =
    weight === 'bold'
      ? theme.fontFamily.bodyBold
      : weight === 'medium'
        ? theme.fontFamily.bodyMedium
        : weight === 'regular'
          ? theme.fontFamily.bodyRegular
          : base.fontFamily;

  // Room for Cairo's descending dots (ي) / tall marks that the line box would
  // clip — see `cairoGlyphPadding`. Uses the final size (caller overrides,
  // font scale capped like `maxFontSizeMultiplier`); a caller's own padding wins.
  const flat = StyleSheet.flatten([base, { fontFamily }, style]) as TextStyle;
  const scale = Math.min(fontScale || 1, MAX_FONT_SCALE);
  const glyphPadding =
    typeof flat.fontFamily === 'string' &&
    flat.fontFamily.startsWith('Cairo') &&
    typeof flat.fontSize === 'number' &&
    typeof flat.lineHeight === 'number' &&
    flat.padding === undefined &&
    flat.paddingVertical === undefined &&
    flat.paddingTop === undefined &&
    flat.paddingBottom === undefined
      ? cairoGlyphPadding(flat.fontSize * scale, flat.lineHeight * scale)
      : null;

  return (
    <RNText
      ref={ref}
      allowFontScaling
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      style={[
        base,
        { fontFamily, color: theme.colors[color], writingDirection: writingDirection() },
        (center || align) && { textAlign: center ? 'center' : align },
        glyphPadding,
        style,
      ]}
      {...rest}
    />
  );
});
