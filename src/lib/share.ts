import { Platform, Share } from 'react-native';

import { createLogger } from './logger';

const log = createLogger('share');

export type ShareOutcome = 'shared' | 'copied' | 'unavailable';

/**
 * Share plain text via the OS share sheet (native) or the Web Share API (web),
 * falling back to the clipboard on web when `navigator.share` is missing —
 * react-native-web's `Share.share` rejects with "Share is not supported in this
 * browser" on unsupported browsers / non-secure origins. Never throws; a
 * user-cancelled share also resolves to `'unavailable'`. The return value lets
 * the caller show an appropriate toast.
 */
export async function shareText(message: string): Promise<ShareOutcome> {
  try {
    if (Platform.OS === 'web') {
      const nav: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined;
      if (typeof nav?.share === 'function') {
        await nav.share({ text: message });
        return 'shared';
      }
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(message);
        return 'copied';
      }
      return 'unavailable';
    }

    await Share.share({ message });
    return 'shared';
  } catch (error) {
    log.debug('share not completed', {
      reason: error instanceof Error ? error.message : 'unknown',
    });
    return 'unavailable';
  }
}
