import * as SecureStore from 'expo-secure-store';

import { createLogger } from '@/lib/logger';

import type { AuthTokens } from './types';

/**
 * Secure persistence for auth tokens.
 *
 * Rules:
 *  - Tokens are stored ONLY in `expo-secure-store` (Keychain / Keystore),
 *    never AsyncStorage, never a Zustand-persisted slice.
 *  - Token values are never logged.
 */
const log = createLogger('token-storage');

const KEYS = {
  accessToken: 'bytari.auth.accessToken',
  refreshToken: 'bytari.auth.refreshToken',
  meta: 'bytari.auth.meta',
} as const;

interface TokenMeta {
  tokenType: 'Bearer';
  expiresIn: number;
  /** Epoch ms when the access token was issued (client clock). */
  issuedAt: number;
}

const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  const meta: TokenMeta = {
    tokenType: tokens.tokenType,
    expiresIn: tokens.expiresIn,
    issuedAt: Date.now(),
  };
  await Promise.all([
    SecureStore.setItemAsync(KEYS.accessToken, tokens.accessToken, secureOptions),
    SecureStore.setItemAsync(KEYS.refreshToken, tokens.refreshToken, secureOptions),
    SecureStore.setItemAsync(KEYS.meta, JSON.stringify(meta), secureOptions),
  ]);
  log.debug('tokens persisted');
}

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  meta: TokenMeta;
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const [accessToken, refreshToken, metaRaw] = await Promise.all([
    SecureStore.getItemAsync(KEYS.accessToken),
    SecureStore.getItemAsync(KEYS.refreshToken),
    SecureStore.getItemAsync(KEYS.meta),
  ]);
  if (!accessToken || !refreshToken) return null;

  let meta: TokenMeta = { tokenType: 'Bearer', expiresIn: 0, issuedAt: 0 };
  if (metaRaw) {
    try {
      meta = { ...meta, ...(JSON.parse(metaRaw) as Partial<TokenMeta>) };
    } catch {
      log.warn('token meta unreadable — ignoring');
    }
  }
  return { accessToken, refreshToken, meta };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.accessToken),
    SecureStore.deleteItemAsync(KEYS.refreshToken),
    SecureStore.deleteItemAsync(KEYS.meta),
  ]);
  log.debug('tokens cleared');
}

/** Heuristic: is the stored access token within `skewSeconds` of expiry? */
export function isAccessTokenNearExpiry(meta: TokenMeta, skewSeconds = 60): boolean {
  if (!meta.issuedAt || !meta.expiresIn) return true;
  const expiresAt = meta.issuedAt + meta.expiresIn * 1000;
  return Date.now() >= expiresAt - skewSeconds * 1000;
}
