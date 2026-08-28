import { I18nManager, Platform } from 'react-native';

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

export const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur']);

export function isRtlLanguage(language: string): boolean {
  return RTL_LANGUAGES.has(language.split('-')[0] ?? language);
}

export interface DirectionResult {
  /** `true` when a native reload is required for the change to take effect. */
  changed: boolean;
  isRTL: boolean;
}

export function applyDirectionForLanguage(language: string): DirectionResult {
  const shouldBeRTL = isRtlLanguage(language);
  I18nManager.allowRTL(true);

  if (I18nManager.isRTL === shouldBeRTL) {
    return { changed: false, isRTL: shouldBeRTL };
  }

  I18nManager.forceRTL(shouldBeRTL);
  log.info('direction changed — native reload required', { language, shouldBeRTL });
  return { changed: true, isRTL: shouldBeRTL };
}

/** Convenience: current layout direction as resolved by the native layer. */
export const isRTL = (): boolean => I18nManager.isRTL;

/** Horizontal sign for transforms/offsets: `1` in LTR, `-1` in RTL. */
export const directionSign = (): 1 | -1 => (I18nManager.isRTL ? -1 : 1);

/** Flip a horizontally-directional icon (chevron, arrow) for the current direction. */
export const flipForDirection = (): { transform: { scaleX: number }[] } => ({
  transform: [{ scaleX: directionSign() }],
});

/** `writingDirection` for `<Text>` so mixed content aligns correctly. */
export const writingDirection = (): 'rtl' | 'ltr' => (I18nManager.isRTL ? 'rtl' : 'ltr');

export const supportsRuntimeReload = Platform.OS !== 'web';
