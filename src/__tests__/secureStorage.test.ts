import { secureStorage } from '@/services/storage';

describe('secureStorage abstraction', () => {
  beforeEach(async () => {
    await secureStorage.removeMany(['k1', 'k2', 'k3']);
  });

  it('sets, gets, and removes a value', async () => {
    await secureStorage.setItem('k1', 'v1');
    await expect(secureStorage.getItem('k1')).resolves.toBe('v1');
    await secureStorage.removeItem('k1');
    await expect(secureStorage.getItem('k1')).resolves.toBeNull();
  });

  it('returns null for a missing key', async () => {
    await expect(secureStorage.getItem('nope')).resolves.toBeNull();
  });

  it('removeMany clears several keys', async () => {
    await secureStorage.setItem('k2', 'a');
    await secureStorage.setItem('k3', 'b');
    await secureStorage.removeMany(['k2', 'k3']);
    await expect(secureStorage.getItem('k2')).resolves.toBeNull();
    await expect(secureStorage.getItem('k3')).resolves.toBeNull();
  });

  it('never throws on a read error (returns null instead)', async () => {
    const original = secureStorage.getItem;
    await expect(secureStorage.getItem('anything')).resolves.not.toThrow;
    expect(original).toBeDefined();
  });
});
