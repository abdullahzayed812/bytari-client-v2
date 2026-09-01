import { createLogger } from '@/lib/logger';
import { secureStorage } from '@/services/storage';

import type { AuthTokens } from '../types';

/**
 * Secure persistence for the auth token pair. Built on the `secureStorage`
 * abstraction — never touches `SecureStore` directly, never AsyncStorage, never
 * a persisted Zustand slice. Token values are never logged.
 */
const log = createLogger('token-storage');

const KEY = {
  access: 'bytari.auth.accessToken',
  refresh: 'bytari.auth.refreshToken',
  meta: 'bytari.auth.meta',
} as const;

export interface TokenMeta {
  tokenType: 'Bearer';
  /** Access-token lifetime in seconds (from the backend). */
  expiresIn: number;
  /** Epoch ms when the pair was stored (client clock). */
  issuedAt: number;
}

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  meta: TokenMeta;
}

const DEFAULT_META: TokenMeta = { tokenType: 'Bearer', expiresIn: 0, issuedAt: 0 };

// --- granular accessors (§4 conceptual API) --------------------------------
export const tokenStorage = {
  getAccessToken(): Promise<string | null> {
    return secureStorage.getItem(KEY.access);
  },
  getRefreshToken(): Promise<string | null> {
    return secureStorage.getItem(KEY.refresh);
  },
  setAccessToken(value: string): Promise<void> {
    return secureStorage.setItem(KEY.access, value);
  },
  setRefreshToken(value: string): Promise<void> {
    return secureStorage.setItem(KEY.refresh, value);
  },

  /** Persist the full pair + freshly stamped meta. */
  async saveTokens(tokens: AuthTokens): Promise<void> {
    const meta: TokenMeta = {
      tokenType: tokens.tokenType,
      expiresIn: tokens.expiresIn,
      issuedAt: Date.now(),
    };
    await Promise.all([
      secureStorage.setItem(KEY.access, tokens.accessToken),
      secureStorage.setItem(KEY.refresh, tokens.refreshToken),
      secureStorage.setItem(KEY.meta, JSON.stringify(meta)),
    ]);
    log.debug('token pair persisted');
  },

  /** Read the whole pair. `null` when either token is missing. */
  async getStoredTokens(): Promise<StoredTokens | null> {
    const [accessToken, refreshToken, rawMeta] = await Promise.all([
      secureStorage.getItem(KEY.access),
      secureStorage.getItem(KEY.refresh),
      secureStorage.getItem(KEY.meta),
    ]);
    if (!accessToken || !refreshToken) return null;

    let meta = DEFAULT_META;
    if (rawMeta) {
      try {
        meta = { ...DEFAULT_META, ...(JSON.parse(rawMeta) as Partial<TokenMeta>) };
      } catch {
        log.warn('token meta unreadable — using defaults');
      }
    }
    return { accessToken, refreshToken, meta };
  },

  clearTokens(): Promise<void> {
    log.debug('clearing token pair');
    return secureStorage.removeMany([KEY.access, KEY.refresh, KEY.meta]);
  },
};

/** Heuristic: is the stored access token within `skewSeconds` of expiry? */
export function isAccessTokenNearExpiry(meta: TokenMeta, skewSeconds = 60): boolean {
  if (!meta.issuedAt || !meta.expiresIn) return true;
  const expiresAt = meta.issuedAt + meta.expiresIn * 1000;
  return Date.now() >= expiresAt - skewSeconds * 1000;
}
