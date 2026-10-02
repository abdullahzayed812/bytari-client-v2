import { getLocales } from 'expo-localization';
import i18n, { type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '@/constants/config';
import { createLogger } from '@/lib/logger';
import { applyDirectionForLanguage } from '@/lib/rtl';

import { ar, type TranslationResources } from './locales/ar';
import { en } from './locales/en';
import { ku } from './locales/ku';

const log = createLogger('i18n');

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const NAMESPACES = [
  'common',
  'nav',
  'errors',
  'auth',
  'admin',
  'pets',
  'poultry',
  'petOwnerStore',
  'home',
  'veterinarian',
  'organizations',
  'orgAnimals',
  'medical',
  'farm',
  'poultryMarket',
  'sheepCattleFarm',
  'publications',
  'veterinaryStore',
  'content',
  'news',
  'chat',
  'clinicAppointments',
  'contact',
  'settings',
  'users',
  'support',
  'notifications',
  'showcase',
  'registration',
  'vetServices',
  'veterinaryOffices',
  'veterinaryOfficeDashboard',
  'veterinaryMagazine',
  'veterinaryBooks',
  'veterinarianStore',
  'vetJobs',
  'vetCourses',
  'syndicates',
  'ads',
  'globalChat',
] as const;
export type Namespace = (typeof NAMESPACES)[number];

// Kurdish is typed as a deep-partial of the Arabic resources: every key it
// does define must match the Arabic shape, and anything not (yet) translated
// falls back to Arabic — the closest script/reading direction for Kurdish
// readers in Iraq — via `fallbackLng`.
const resources = { ar, en, ku } as unknown as Record<AppLanguage, TranslationResources>;

export function resolveDeviceLanguage(): AppLanguage {
  const code = getLocales()[0]?.languageCode ?? DEFAULT_LANGUAGE;
  // Devices report Central Kurdish as `ckb` (Sorani) — the app's `ku`.
  const preferred = code === 'ckb' ? 'ku' : code;
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(preferred)
    ? (preferred as AppLanguage)
    : DEFAULT_LANGUAGE;
}

let initialised = false;

/**
 * Initialise i18next once. `language` is the persisted preference (or resolved
 * from the device). Also forces the layout direction for that language — the
 * caller must reload the app if `directionChanged` is `true`.
 */
export function initI18n(language: AppLanguage): { directionChanged: boolean } {
  if (!initialised) {
    void i18n.use(initReactI18next).init({
      resources: resources as unknown as Resource,
      lng: language,
      fallbackLng: { ku: ['ar'], default: [DEFAULT_LANGUAGE] },
      defaultNS: 'common',
      ns: NAMESPACES as unknown as string[],
      interpolation: { escapeValue: false },
      returnNull: false,
      // Hermes ships without a full `Intl.PluralRules`, which i18next's default
      // v4 plural handling needs. The app uses no ICU plural keys, so pin the
      // legacy resolver — behaviour is identical and the startup error goes
      // away. Add `@formatjs/intl-pluralrules` + switch back to v4 if real
      // Arabic pluralisation is ever needed.
      compatibilityJSON: 'v3',
    });
    initialised = true;
    log.info('i18n initialised', { language });
  } else if (i18n.language !== language) {
    void i18n.changeLanguage(language);
  }

  const { changed } = applyDirectionForLanguage(language);
  return { directionChanged: changed };
}

/** Every selectable language, in picker order, with its `nav` label key. */
export const LANGUAGE_OPTIONS = [
  { value: 'ar', labelKey: 'more.languageArabic' },
  { value: 'en', labelKey: 'more.languageEnglish' },
  { value: 'ku', labelKey: 'more.languageKurdish' },
] as const satisfies readonly { value: AppLanguage; labelKey: string }[];

/** `nav` key of one language's own name (shown in that language's script). */
export function languageLabelKey(
  language: AppLanguage,
): (typeof LANGUAGE_OPTIONS)[number]['labelKey'] {
  return LANGUAGE_OPTIONS.find((o) => o.value === language)?.labelKey ?? 'more.languageArabic';
}

/** Change language at runtime. Returns whether a native reload is required. */
export async function setLanguage(language: AppLanguage): Promise<{ directionChanged: boolean }> {
  await i18n.changeLanguage(language);
  const { changed } = applyDirectionForLanguage(language);
  return { directionChanged: changed };
}

export { i18n };

// --- typed `t()` -------------------------------------------------------
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: TranslationResources;
  }
}
