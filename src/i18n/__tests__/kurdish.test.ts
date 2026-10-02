import { SUPPORTED_LANGUAGES } from '@/constants/config';
import { isRtlLanguage } from '@/lib/rtl';

import { LANGUAGE_OPTIONS, NAMESPACES, i18n, initI18n, setLanguage } from '..';
import { ku } from '../locales/ku';

/** Kurdish (Sorani, `ku`) — the third app language, alongside Arabic and English. */
describe('Kurdish locale', () => {
  beforeAll(() => {
    initI18n('ar');
  });
  afterAll(async () => {
    await setLanguage('ar');
  });

  it('is a supported, selectable, right-to-left language', () => {
    expect(SUPPORTED_LANGUAGES).toContain('ku');
    expect(LANGUAGE_OPTIONS.map((o) => o.value)).toEqual(['ar', 'en', 'ku']);
    expect(isRtlLanguage('ku')).toBe(true);
    expect(isRtlLanguage('ckb')).toBe(true);
  });

  it('translates every user-facing namespace (only the staff admin console falls back)', () => {
    const missing = NAMESPACES.filter((ns) => !(ns in ku));
    expect(missing).toEqual(['admin']);
  });

  it('resolves Kurdish strings and falls back to Arabic for untranslated keys', async () => {
    await setLanguage('ku');
    expect(i18n.t('chat:list.title')).toBe('گفتوگۆکان');
    expect(i18n.t('notifications:source.ADMIN')).toBe('بەڕێوەبەرایەتی بیتەری');
    // `admin` is not translated → Arabic, never a raw key.
    const adminTitle = i18n.t('admin:common.cancel' as never);
    expect(adminTitle).not.toBe('common.cancel');
    expect(adminTitle).toBe(i18n.getFixedT('ar')('admin:common.cancel' as never));
  });

  it('switching back to Arabic / English keeps their own text intact', async () => {
    await setLanguage('ar');
    expect(i18n.t('chat:list.title')).toBe('المحادثات');
    await setLanguage('en');
    expect(i18n.t('chat:list.title')).not.toBe('گفتوگۆکان');
  });
});
