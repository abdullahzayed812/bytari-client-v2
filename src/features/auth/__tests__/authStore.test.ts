import { ApiError } from '@/services/api/errors';

import { authApi } from '../api';
import { tokenStorage } from '../services';
import { useAuthStore } from '../store';
import type { AuthResult, SessionSnapshot } from '../types';

const snapshot: SessionSnapshot = {
  user: {
    id: 'u1',
    email: 'vet@example.com',
    firstName: 'Reem',
    lastName: 'Ali',
    phone: null,
    status: 'ACTIVE',
    veterinarianStatus: 'APPROVED',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  roles: ['PET_OWNER', 'VETERINARIAN'],
  permissions: [],
  isAdmin: false,
  supervisorDomains: [],
  veterinarian: { status: 'APPROVED', approved: true },
};

const authResult: AuthResult = {
  user: snapshot.user,
  tokens: { accessToken: 'a1', refreshToken: 'r1', tokenType: 'Bearer', expiresIn: 900 },
};

const authError = (code: string) =>
  new ApiError({ code: code as never, message: 'x', status: 401 });

describe('auth store — session lifecycle', () => {
  const me = jest.spyOn(authApi, 'me');
  const login = jest.spyOn(authApi, 'login');
  const register = jest.spyOn(authApi, 'register');
  const refresh = jest.spyOn(authApi, 'refresh');
  const logout = jest.spyOn(authApi, 'logout');
  const logoutAll = jest.spyOn(authApi, 'logoutAll');

  beforeEach(async () => {
    await tokenStorage.clearTokens();
    useAuthStore.setState({ status: 'bootstrapping', user: null, session: null, tokens: null });
    jest.clearAllMocks();
    me.mockResolvedValue(snapshot);
    login.mockResolvedValue(authResult);
    register.mockResolvedValue(authResult);
    refresh.mockResolvedValue({ tokens: authResult.tokens });
    logout.mockResolvedValue({ success: true });
    logoutAll.mockResolvedValue({ success: true, revokedSessions: 2 });
  });

  afterAll(() => jest.restoreAllMocks());

  it('initialize → "unauthenticated" when no tokens are stored', async () => {
    await useAuthStore.getState().initialize();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(me).not.toHaveBeenCalled();
  });

  it('initialize → "authenticated" when the stored access token is still valid', async () => {
    await tokenStorage.saveTokens(authResult.tokens);
    await useAuthStore.getState().initialize();
    expect(me).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().session?.user.id).toBe('u1');
  });

  it('initialize → recovers an expired access token with exactly one refresh', async () => {
    await tokenStorage.saveTokens({ ...authResult.tokens, refreshToken: 'r-old' });
    me.mockRejectedValueOnce(authError('INVALID_TOKEN')).mockResolvedValueOnce(snapshot);

    await useAuthStore.getState().initialize();
    expect(refresh).toHaveBeenCalledWith('r-old');
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('initialize → signs out when the refresh also fails', async () => {
    await tokenStorage.saveTokens({ ...authResult.tokens, refreshToken: 'r-bad' });
    me.mockRejectedValue(authError('INVALID_TOKEN'));
    refresh.mockRejectedValue(authError('INVALID_REFRESH_TOKEN'));

    await useAuthStore.getState().initialize();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    await expect(tokenStorage.getStoredTokens()).resolves.toBeNull();
  });

  it('login → unauthenticated → authenticated with a session snapshot + persisted tokens', async () => {
    await useAuthStore.getState().login({ email: 'vet@example.com', password: 'secret' });
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().tokens?.accessToken).toBe('a1');
    expect(useAuthStore.getState().session?.veterinarian.approved).toBe(true);
    await expect(tokenStorage.getAccessToken()).resolves.toBe('a1');
  });

  it('login → rejects and stays unauthenticated on bad credentials', async () => {
    useAuthStore.setState({ status: 'unauthenticated' });
    login.mockRejectedValueOnce(authError('INVALID_CREDENTIALS'));
    await expect(
      useAuthStore.getState().login({ email: 'x@y.z', password: 'bad' }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('register → establishes a session like login', async () => {
    await useAuthStore.getState().register({
      email: 'new@user.com',
      password: 'longenough1',
      firstName: 'New',
      lastName: 'User',
    });
    expect(register).toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('logout → clears session + tokens and calls the backend', async () => {
    await useAuthStore.getState().login({ email: 'a', password: 'b' });
    await useAuthStore.getState().logout();
    expect(logout).toHaveBeenCalledWith('r1');
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().tokens).toBeNull();
    await expect(tokenStorage.getStoredTokens()).resolves.toBeNull();
  });

  it('logout → still clears locally when the backend call fails', async () => {
    await useAuthStore.getState().login({ email: 'a', password: 'b' });
    logout.mockRejectedValueOnce(new Error('offline'));
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('logoutAll → revokes every session and clears locally', async () => {
    await useAuthStore.getState().login({ email: 'a', password: 'b' });
    await useAuthStore.getState().logoutAll();
    expect(logoutAll).toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('refreshSession → re-pulls /auth/me without touching tokens', async () => {
    await useAuthStore.getState().login({ email: 'a', password: 'b' });
    me.mockResolvedValueOnce({ ...snapshot, isAdmin: true });
    await useAuthStore.getState().refreshSession();
    expect(useAuthStore.getState().session?.isAdmin).toBe(true);
    expect(useAuthStore.getState().tokens?.accessToken).toBe('a1');
  });
});
