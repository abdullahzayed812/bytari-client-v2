import { forwardRef } from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { writingDirection } from '@/lib/rtl';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/colors';
import type { TypographyVariant } from '@/theme/typography';

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
  const base = theme.typography[variant];

  const fontFamily =
    weight === 'bold'
      ? theme.fontFamily.bodyBold
      : weight === 'medium'
        ? theme.fontFamily.bodyMedium
        : weight === 'regular'
          ? theme.fontFamily.bodyRegular
          : base.fontFamily;

  return (
    <RNText
      ref={ref}
      allowFontScaling
      maxFontSizeMultiplier={1.6}
      style={[
        base,
        { fontFamily, color: theme.colors[color], writingDirection: writingDirection() },
        (center || align) && { textAlign: center ? 'center' : align },
        style,
      ]}
      {...rest}
    />
  );
});
