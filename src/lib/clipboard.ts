import { Platform } from 'react-native';

import { createLogger } from './logger';

const log = createLogger('clipboard');

/**
 * Copy plain text to the clipboard. Web: the async Clipboard API, falling back
 * to a hidden textarea + `execCommand('copy')` (iframes / non-secure origins).
 * Native: `expo-clipboard`, loaded lazily so a build that predates the native
 * module just reports `false` (the caller can fall back to the share sheet).
 * Never throws.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      const nav: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined;
      if (nav?.clipboard?.writeText) {
        try {
          await nav.clipboard.writeText(text);
          return true;
        } catch {
          // permission / iframe — fall through to the legacy path
        }
      }
      if (typeof document === 'undefined') return false;
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.focus();
      area.select();
      try {
        return document.execCommand('copy');
      } finally {
        document.body.removeChild(area);
      }
    }
    // Required at call time (not imported at module load): on a build that
    // predates the native module, loading it throws — caught below.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Clipboard = require('expo-clipboard') as typeof import('expo-clipboard');
    return await Clipboard.setStringAsync(text);
  } catch (error) {
    log.debug('copy failed', { reason: error instanceof Error ? error.message : 'unknown' });
    return false;
  }
}
