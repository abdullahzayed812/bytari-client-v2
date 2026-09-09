import Constants from 'expo-constants';
import { I18nManager, Platform } from 'react-native';

import { DEFAULT_LANGUAGE } from '@/constants/config';

import { createLogger } from './logger';

/**
 * Global RTL strategy.
 *
 * The app is Arabic-first, so RTL is forced on at startup. React Native applies
 * `I18nManager` direction changes only after a native reload, so:
 *  - `bootstrapDirection()` runs once, as early as possible (imported by the root
 *    layout before the first render), and forces the direction for the active
 *    language.
 *  - When the direction actually needs to flip (e.g. user switches AR↔EN at
 *    runtime), it returns `{ changed: true }` and the caller reloads the app.
 *
 * Components should NOT hand-reverse layouts. Use flexbox with `flex-start` /
 * `flex-end` and the `start`/`end` style props, plus the helpers below for the
 * rare directional case (chevrons, back arrows).
 */
const log = createLogger('rtl');

/**
 * Expo Go (SDK 53+, new architecture) cannot apply a native `I18nManager`
 * direction change: `forceRTL()` never sticks, so `I18nManager.isRTL` stays
 * `false` and every launch re-detects a "direction changed", reloading the app
 * forever — which wedges it on the splash screen. RTL needs a development build.
 */
export const isExpoGo =
  Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';

export const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur']);

export function isRtlLanguage(language: string): boolean {
  return RTL_LANGUAGES.has(language.split('-')[0] ?? language);
}

const IS_WEB = Platform.OS === 'web';

/**
 * Web has no `I18nManager` (react-native-web stubs it to a no-op), so we track
 * direction ourselves and drive it through the DOM `dir` attribute. Seeded from
 * the default language; `applyDirectionForLanguage` keeps it in sync.
 */
let webIsRTL = isRtlLanguage(DEFAULT_LANGUAGE);

/** Push the current direction onto `<html dir lang>` (web only, DOM present). */
function syncWebDocumentDirection(language: string, rtl: boolean): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  document.documentElement.lang = language.split('-')[0] ?? language;
}

export interface DirectionResult {
  /** `true` when a native reload is required for the change to take effect. */
  changed: boolean;
  isRTL: boolean;
}

export function applyDirectionForLanguage(language: string): DirectionResult {
  const shouldBeRTL = isRtlLanguage(language);

  if (IS_WEB) {
    // No reload needed — the browser reflows `dir`-sensitive layout live, and a
    // language switch already re-renders the tree via react-i18next.
    webIsRTL = shouldBeRTL;
    syncWebDocumentDirection(language, shouldBeRTL);
    return { changed: false, isRTL: shouldBeRTL };
  }

  I18nManager.allowRTL(true);

  if (I18nManager.isRTL === shouldBeRTL) {
    return { changed: false, isRTL: shouldBeRTL };
  }

  if (isExpoGo) {
    // `forceRTL` is a no-op here; pretend nothing changed so bootstrap proceeds
    // and the app renders (LTR) instead of reload-looping on the splash screen.
    log.warn('RTL layout needs a development build — Expo Go renders LTR', {
      language,
      shouldBeRTL,
    });
    return { changed: false, isRTL: I18nManager.isRTL };
  }

  I18nManager.forceRTL(shouldBeRTL);
  log.info('direction changed — native reload required', { language, shouldBeRTL });
  return { changed: true, isRTL: shouldBeRTL };
}

/** Current layout direction: `I18nManager` on native, the DOM-driven flag on web. */
export const isRTL = (): boolean => (IS_WEB ? webIsRTL : I18nManager.isRTL);

/** Horizontal sign for transforms/offsets: `1` in LTR, `-1` in RTL. */
export const directionSign = (): 1 | -1 => (isRTL() ? -1 : 1);

/** Flip a horizontally-directional icon (chevron, arrow) for the current direction. */
export const flipForDirection = (): { transform: { scaleX: number }[] } => ({
  transform: [{ scaleX: directionSign() }],
});

/** `writingDirection` for `<Text>` so mixed content aligns correctly. */
export const writingDirection = (): 'rtl' | 'ltr' => (isRTL() ? 'rtl' : 'ltr');

export const supportsRuntimeReload = Platform.OS !== 'web';
