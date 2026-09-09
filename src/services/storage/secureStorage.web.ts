import { createLogger } from '@/lib/logger';

import type { SecureStorage } from './secureStorage';

// Re-exported so `./storage` barrel's `export { type SecureStorage } from
// './secureStorage'` still resolves when Metro picks this `.web` variant.
export type { SecureStorage } from './secureStorage';

/**
 * Web implementation of the `secureStorage` abstraction.
 *
 * `expo-secure-store` has no web backend (its methods are literally
 * `undefined`, so `saveTokens` throws
 * `_ExpoSecureStore.default.setValueWithKeyAsync is not a function`). The web
 * has no OS-backed keystore, so we fall back to `localStorage` — the standard
 * Expo guidance. Same interface, so `tokenStorage` and callers are unchanged.
 *
 * All access is guarded: `localStorage` is absent during static prerender and
 * throws in private-mode / storage-disabled browsers.
 */
const log = createLogger('secure-storage');

function store(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export const secureStorage: SecureStorage = {
  async getItem(key) {
    try {
      return store()?.getItem(key) ?? null;
    } catch (error) {
      log.warn('read failed', { key, reason: reason(error) });
      return null;
    }
  },

  async setItem(key, value) {
    const s = store();
    if (!s) {
      log.warn('write skipped — no localStorage', { key });
      return;
    }
    s.setItem(key, value);
    log.debug('stored', { key });
  },

  async removeItem(key) {
    try {
      store()?.removeItem(key);
      log.debug('removed', { key });
    } catch (error) {
      log.warn('remove failed', { key, reason: reason(error) });
    }
  },

  async removeMany(keys) {
    await Promise.all(keys.map((key) => this.removeItem(key)));
  },

  async isAvailable() {
    return store() != null;
  },
};

function reason(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown';
}
