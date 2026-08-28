import { getLocales } from 'expo-localization';
import i18n, { type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '@/constants/config';
import { createLogger } from '@/lib/logger';
import { applyDirectionForLanguage } from '@/lib/rtl';

import { ar, type TranslationResources } from './locales/ar';
import { en } from './locales/en';

const log = createLogger('i18n');

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const NAMESPACES = ['common', 'nav', 'errors', 'showcase'] as const;
export type Namespace = (typeof NAMESPACES)[number];

const resources: Record<AppLanguage, TranslationResources> = { ar, en };

export function resolveDeviceLanguage(): AppLanguage {
  const preferred = getLocales()[0]?.languageCode ?? DEFAULT_LANGUAGE;
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
      fallbackLng: DEFAULT_LANGUAGE,
      defaultNS: 'common',
      ns: NAMESPACES as unknown as string[],
      interpolation: { escapeValue: false },
      returnNull: false,
    });
    initialised = true;
    log.info('i18n initialised', { language });
  } else if (i18n.language !== language) {
    void i18n.changeLanguage(language);
  }

  const { changed } = applyDirectionForLanguage(language);
  return { directionChanged: changed };
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
