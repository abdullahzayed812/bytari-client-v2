import * as SecureStore from 'expo-secure-store';

import { createLogger } from '@/lib/logger';

/**
 * Generic secure key/value storage abstraction over `expo-secure-store`
 * (iOS Keychain / Android Keystore).
 *
 * Domain code depends on THIS, not on `SecureStore` directly. Only key names are
 * ever logged — values (which may be credentials) never are.
 */
const log = createLogger('secure-storage');

const DEFAULT_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export interface SecureStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  removeMany(keys: string[]): Promise<void>;
  isAvailable(): Promise<boolean>;
}

export const secureStorage: SecureStorage = {
  async getItem(key) {
    try {
      return await SecureStore.getItemAsync(key, DEFAULT_OPTIONS);
    } catch (error) {
      log.warn('read failed', { key, reason: reason(error) });
      return null;
    }
  },

  async setItem(key, value) {
    await SecureStore.setItemAsync(key, value, DEFAULT_OPTIONS);
    log.debug('stored', { key });
  },

  async removeItem(key) {
    await SecureStore.deleteItemAsync(key, DEFAULT_OPTIONS);
    log.debug('removed', { key });
  },

  async removeMany(keys) {
    await Promise.all(keys.map((key) => this.removeItem(key)));
  },

  async isAvailable() {
    try {
      return await SecureStore.isAvailableAsync();
    } catch {
      return false;
    }
  },
};

function reason(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown';
}
