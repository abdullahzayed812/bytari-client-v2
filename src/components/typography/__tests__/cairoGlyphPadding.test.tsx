import { Dimensions, StyleSheet, Text as RNText } from 'react-native';

import { cairoGlyphPadding } from '@/theme/typography';
import { renderWithProviders, screen } from '@/test-utils/render';

import { Caption, Heading } from '..';

const styleOf = (text: string) =>
  StyleSheet.flatten(
    screen.UNSAFE_getAllByType(RNText).find((n) => n.props.children === text)?.props.style,
  );

describe('Cairo glyph room (dots of ي are not clipped)', () => {
  it('pads the tight Cairo line boxes, enough for the 0.462em descender', () => {
    // display 30/40: bounds end 9px below the baseline, ي needs ~14px.
    expect(cairoGlyphPadding(30, 40)).toEqual({ paddingTop: 3, paddingBottom: 6 });
    expect(cairoGlyphPadding(24, 34)).toEqual({ paddingTop: 2, paddingBottom: 4 });
    expect(cairoGlyphPadding(20, 30)).toEqual({ paddingTop: 0, paddingBottom: 3 });
    // A line height that already fits the glyphs needs nothing.
    expect(cairoGlyphPadding(20, 40)).toBeNull();
  });

  it('applies it to Cairo headings only (scaled), and lets a caller padding win', () => {
    renderWithProviders(
      <>
        <Heading level={1}>مرحباً بك في بيطري</Heading>
        <Caption>تعليق</Caption>
        <Heading level={1} style={{ padding: 0 }}>
          بدون
        </Heading>
      </>,
    );
    // Scales with the user's font size (capped like maxFontSizeMultiplier).
    const scale = Math.min(Dimensions.get('window').fontScale || 1, 1.6);
    expect(styleOf('مرحباً بك في بيطري')).toMatchObject(
      cairoGlyphPadding(30 * scale, 40 * scale) ?? {},
    );
    expect(styleOf('تعليق')?.paddingBottom).toBeUndefined();
    expect(styleOf('بدون')).toMatchObject({ padding: 0 });
    expect(styleOf('بدون')?.paddingBottom).toBeUndefined();
  });
});
