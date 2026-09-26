import { Platform, Share } from 'react-native';

import { env } from './env';
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
export async function shareText(message: string, url?: string): Promise<ShareOutcome> {
  try {
    if (Platform.OS === 'web') {
      const nav: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined;
      if (typeof nav?.share === 'function') {
        await nav.share(url ? { text: message, url } : { text: message });
        return 'shared';
      }
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(url ? `${message}\n${url}` : message);
        return 'copied';
      }
      return 'unavailable';
    }

    // Android only reads `message`; iOS shows `url` as a rich link — send both.
    await Share.share(url ? { message: `${message}\n${url}`, url } : { message });
    return 'shared';
  } catch (error) {
    log.debug('share not completed', {
      reason: error instanceof Error ? error.message : 'unknown',
    });
    return 'unavailable';
  }
}

/**
 * Absolute, shareable https link for an in-app route path (e.g.
 * `/veterinary-offices/<id>`). On web it uses the current origin; on native
 * the configured public web origin (`EXPO_PUBLIC_WEB_URL`, default
 * https://baytari.com) — the Expo Web build served there resolves the same
 * route to the same details screen. Route groups like `(app)` are stripped:
 * they never appear in a URL.
 */
export function shareUrlFor(routePath: string): string {
  const path = routePath.replace(/\/\([^/]+\)/g, '') || '/';
  const origin =
    Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : env.webUrl;
  return `${origin.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
