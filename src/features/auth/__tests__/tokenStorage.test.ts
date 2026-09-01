import { secureStorage } from '@/services/storage';

import { isAccessTokenNearExpiry, tokenStorage, type TokenMeta } from '../services/tokenStorage';
import type { AuthTokens } from '../types';

const tokens: AuthTokens = {
  accessToken: 'access.jwt.value',
  refreshToken: 'opaque-refresh-value',
  tokenType: 'Bearer',
  expiresIn: 900,
};

describe('tokenStorage (secure)', () => {
  beforeEach(async () => {
    await tokenStorage.clearTokens();
  });

  it('round-trips the token pair through secure storage', async () => {
    await tokenStorage.saveTokens(tokens);
    const stored = await tokenStorage.getStoredTokens();
    expect(stored?.accessToken).toBe(tokens.accessToken);
    expect(stored?.refreshToken).toBe(tokens.refreshToken);
    expect(stored?.meta.expiresIn).toBe(900);
    expect(stored?.meta.issuedAt).toBeGreaterThan(0);
  });

  it('exposes granular accessors', async () => {
    await tokenStorage.setAccessToken('a1');
    await tokenStorage.setRefreshToken('r1');
    await expect(tokenStorage.getAccessToken()).resolves.toBe('a1');
    await expect(tokenStorage.getRefreshToken()).resolves.toBe('r1');
  });

  it('returns null when nothing is stored', async () => {
    await expect(tokenStorage.getStoredTokens()).resolves.toBeNull();
  });

  it('clears every token key', async () => {
    await tokenStorage.saveTokens(tokens);
    await tokenStorage.clearTokens();
    await expect(tokenStorage.getStoredTokens()).resolves.toBeNull();
    await expect(tokenStorage.getAccessToken()).resolves.toBeNull();
  });

  it('is backed by the secureStorage abstraction, not AsyncStorage', async () => {
    const spy = jest.spyOn(secureStorage, 'setItem');
    await tokenStorage.setAccessToken('x');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('detects an access token near expiry', () => {
    const now = Date.now();
    const meta = (issuedAt: number, expiresIn = 900): TokenMeta => ({
      tokenType: 'Bearer',
      expiresIn,
      issuedAt,
    });
    expect(isAccessTokenNearExpiry(meta(now))).toBe(false);
    expect(isAccessTokenNearExpiry(meta(now - 900_000))).toBe(true);
    expect(isAccessTokenNearExpiry(meta(0, 0))).toBe(true);
  });
});
