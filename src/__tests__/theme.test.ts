import { buildTheme, defaultTheme, lightColors } from '@/theme';
import { typography } from '@/theme/typography';

describe('theme tokens', () => {
  it('exposes a complete token set on the default (light) theme', () => {
    expect(defaultTheme.scheme).toBe('light');
    for (const key of [
      'colors',
      'spacing',
      'radius',
      'shadows',
      'sizes',
      'zIndex',
      'typography',
      'fontFamily',
    ] as const) {
      expect(defaultTheme[key]).toBeDefined();
    }
    expect(defaultTheme.colors).toBe(lightColors);
  });

  it('uses the brand green as the primary colour', () => {
    expect(defaultTheme.colors.primary).toBe('#0BAA55');
  });

  it('builds a distinct dark theme with the same token shape', () => {
    const dark = buildTheme('dark');
    expect(dark.scheme).toBe('dark');
    expect(Object.keys(dark.colors).sort()).toEqual(Object.keys(lightColors).sort());
    expect(dark.colors.background).not.toBe(lightColors.background);
  });

  it('defines every typography variant with size + lineHeight + an Arabic font', () => {
    const variants = [
      'display',
      'heading',
      'title',
      'subtitle',
      'body',
      'bodyMedium',
      'label',
      'caption',
    ] as const;
    for (const v of variants) {
      expect(typography[v].fontSize).toBeGreaterThan(0);
      expect(typography[v].lineHeight).toBeGreaterThan(0);
      expect(typography[v].fontFamily).toMatch(/Tajawal|Cairo/);
    }
  });

  it('has an accessible minimum touch target', () => {
    expect(defaultTheme.sizes.touchTarget).toBeGreaterThanOrEqual(44);
  });
});
