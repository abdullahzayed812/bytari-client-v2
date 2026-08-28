import {
  clearTokens,
  isAccessTokenNearExpiry,
  loadTokens,
  saveTokens,
} from '@/services/auth/tokenStorage';
import type { AuthTokens } from '@/services/auth';

const tokens: AuthTokens = {
  accessToken: 'access.jwt.value',
  refreshToken: 'opaque-refresh-value',
  tokenType: 'Bearer',
  expiresIn: 900,
};

describe('secure token storage', () => {
  beforeEach(async () => {
    await clearTokens();
  });

  it('round-trips tokens through secure storage', async () => {
    await saveTokens(tokens);
    const loaded = await loadTokens();
    expect(loaded?.accessToken).toBe(tokens.accessToken);
    expect(loaded?.refreshToken).toBe(tokens.refreshToken);
    expect(loaded?.meta.expiresIn).toBe(900);
    expect(loaded?.meta.issuedAt).toBeGreaterThan(0);
  });

  it('returns null when nothing is stored', async () => {
    await expect(loadTokens()).resolves.toBeNull();
  });

  it('clears all token keys', async () => {
    await saveTokens(tokens);
    await clearTokens();
    await expect(loadTokens()).resolves.toBeNull();
  });

  it('detects an access token near expiry', () => {
    const now = Date.now();
    expect(isAccessTokenNearExpiry({ tokenType: 'Bearer', expiresIn: 900, issuedAt: now })).toBe(
      false,
    );
    expect(
      isAccessTokenNearExpiry({ tokenType: 'Bearer', expiresIn: 900, issuedAt: now - 900_000 }),
    ).toBe(true);
    expect(isAccessTokenNearExpiry({ tokenType: 'Bearer', expiresIn: 0, issuedAt: 0 })).toBe(true);
  });
});
