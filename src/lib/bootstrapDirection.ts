import { I18nManager, Platform } from 'react-native';

import { DEFAULT_LANGUAGE } from '@/constants/config';

import { isExpoGo, isRtlLanguage } from './rtl';

/**
 * Synchronous, run-once side effect executed as the very first import in the
 * root layout — before React renders. It forces the layout direction for the
 * default (Arabic) language so the first frame is already RTL, avoiding a
 * first-launch reload for the common case.
 *
 * A *runtime* language change to a different-direction language still needs a
 * native reload; that path is handled explicitly in the UI.
 */
if (Platform.OS === 'web') {
  // react-native-web ignores `I18nManager`; RTL on web is the DOM `dir`
  // attribute. `app/+html.tsx` already sets it for static/first paint — this
  // covers the dev server and any client-only mount.
  if (typeof document !== 'undefined' && isRtlLanguage(DEFAULT_LANGUAGE)) {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = DEFAULT_LANGUAGE;
  }
} else {
  I18nManager.allowRTL(true);
  if (!isExpoGo && isRtlLanguage(DEFAULT_LANGUAGE) && !I18nManager.isRTL) {
    I18nManager.forceRTL(true);
  }
}

export const directionBootstrapped = true;
