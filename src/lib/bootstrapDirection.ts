import { I18nManager } from 'react-native';

import { DEFAULT_LANGUAGE } from '@/constants/config';

import { isRtlLanguage } from './rtl';

/**
 * Synchronous, run-once side effect executed as the very first import in the
 * root layout — before React renders. It forces the layout direction for the
 * default (Arabic) language so the first frame is already RTL, avoiding a
 * first-launch reload for the common case.
 *
 * A *runtime* language change to a different-direction language still needs a
 * native reload; that path is handled explicitly in the UI.
 */
I18nManager.allowRTL(true);
if (isRtlLanguage(DEFAULT_LANGUAGE) && !I18nManager.isRTL) {
  I18nManager.forceRTL(true);
}

export const directionBootstrapped = true;
