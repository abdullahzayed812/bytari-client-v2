import { I18nManager } from 'react-native';

import { applyDirectionForLanguage, isRtlLanguage, writingDirection } from '@/lib/rtl';

describe('RTL configuration', () => {
  afterEach(() => {
    (I18nManager.forceRTL as jest.Mock).mockClear?.();
  });

  it('classifies RTL vs LTR languages (incl. region tags)', () => {
    expect(isRtlLanguage('ar')).toBe(true);
    expect(isRtlLanguage('ar-SA')).toBe(true);
    expect(isRtlLanguage('he')).toBe(true);
    expect(isRtlLanguage('en')).toBe(false);
    expect(isRtlLanguage('en-US')).toBe(false);
  });

  it('reports no change when the direction already matches', () => {
    const target = I18nManager.isRTL ? 'ar' : 'en';
    const result = applyDirectionForLanguage(target);
    expect(result.changed).toBe(false);
    expect(result.isRTL).toBe(I18nManager.isRTL);
  });

  it('flags a required reload when the direction must flip', () => {
    const opposite = I18nManager.isRTL ? 'en' : 'ar';
    const result = applyDirectionForLanguage(opposite);
    expect(result.changed).toBe(true);
    expect(result.isRTL).toBe(!I18nManager.isRTL);
  });

  it('derives a writing direction string', () => {
    expect(['rtl', 'ltr']).toContain(writingDirection());
  });
});
