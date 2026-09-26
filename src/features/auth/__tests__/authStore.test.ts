import { ApiError } from '@/services/api/errors';

import { authApi } from '../api';
import { tokenStorage } from '../services';
import { useAuthStore } from '../store';
import type { AuthResult, RegisterResult, SessionSnapshot, User } from '../types';

const snapshot: SessionSnapshot = {
  user: {
    id: 'u1',
    email: 'vet@example.com',
    firstName: 'Reem',
    lastName: 'Ali',
    phone: null,
    status: 'ACTIVE',
    veterinarianStatus: 'APPROVED',
    traderStatus: 'NOT_REGISTERED' as const,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  roles: ['PET_OWNER', 'VETERINARIAN'],
  permissions: [],
  isAdmin: false,
  supervisorDomains: [],
  veterinarian: { status: 'APPROVED', approved: true },
  trader: { status: 'NOT_REGISTERED', approved: false },
};

const authResult: AuthResult = {
  user: snapshot.user,
  tokens: { accessToken: 'a1', refreshToken: 'r1', tokenType: 'Bearer', expiresIn: 900 },
};

/** `POST /auth/register`'s default mock — /auth/me still needs its own `snapshot` mock per test. */
const registerResult: RegisterResult = { ...authResult, codeExpiresInSeconds: 600 };

const pendingUser: User = { ...snapshot.user, status: 'PENDING_VERIFICATION' };
const pendingSnapshot: SessionSnapshot = { ...snapshot, user: pendingUser };

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
    register.mockResolvedValue(registerResult);
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

  it('register → does NOT reach "authenticated" — the account starts PENDING_VERIFICATION', async () => {
    me.mockResolvedValueOnce(pendingSnapshot);
    await useAuthStore.getState().register({
      email: 'new@user.com',
      password: 'longenough1',
      firstName: 'New',
      lastName: 'User',
      phone: '+9647700000000',
    });
    expect(register).toHaveBeenCalled();
    // the token IS persisted (register()'s token is real, just scoped)…
    expect(useAuthStore.getState().tokens?.accessToken).toBe('a1');
    // …but the store deliberately does NOT call it "authenticated".
    expect(useAuthStore.getState().status).toBe('pending-verification');
    expect(useAuthStore.getState().user?.status).toBe('PENDING_VERIFICATION');
  });

  it('verifyEmail → establishes a normal session, same as login', async () => {
    const verifyEmail = jest.spyOn(authApi, 'verifyEmail').mockResolvedValueOnce(authResult);
    await useAuthStore.getState().verifyEmail({ email: 'new@user.com', code: '123456' });
    expect(verifyEmail).toHaveBeenCalledWith({ email: 'new@user.com', code: '123456' });
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().tokens?.accessToken).toBe('a1');
  });

  it('resendVerification → thin passthrough to authApi', async () => {
    const resend = jest
      .spyOn(authApi, 'resendVerification')
      .mockResolvedValueOnce({ codeExpiresInSeconds: 600, resendAvailableInSeconds: 45 });
    const result = await useAuthStore.getState().resendVerification('new@user.com');
    expect(resend).toHaveBeenCalledWith('new@user.com');
    expect(result.resendAvailableInSeconds).toBe(45);
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

  it('register as VETERINARIAN → "pending-approval" (no email-verification step)', async () => {
    const vetUser: User = {
      ...snapshot.user,
      status: 'ACTIVE',
      veterinarianStatus: 'NOT_APPLIED',
      registrationType: 'VETERINARIAN',
    };
    register.mockResolvedValueOnce({
      user: vetUser,
      tokens: authResult.tokens,
      codeExpiresInSeconds: null,
    });
    me.mockResolvedValueOnce({
      ...snapshot,
      user: vetUser,
      accessState: 'VETERINARIAN_APPROVAL_REQUIRED',
      veterinarian: { status: 'NOT_APPLIED', approved: false },
    });
    await useAuthStore.getState().register({
      email: 'v@x.c',
      password: 'p',
      firstName: 'a',
      lastName: 'b',
      phone: '+9647700000000',
      accountType: 'VETERINARIAN',
    });
    expect(register).toHaveBeenCalledWith(expect.objectContaining({ accountType: 'VETERINARIAN' }));
    expect(useAuthStore.getState().status).toBe('pending-approval');
  });

  it('login + app restart for a pending vet stay "pending-approval"', async () => {
    const gated = { ...snapshot, accessState: 'VETERINARIAN_APPROVAL_REQUIRED' as const };
    me.mockResolvedValue(gated);
    await useAuthStore.getState().login({ email: 'a', password: 'b' });
    expect(useAuthStore.getState().status).toBe('pending-approval');

    useAuthStore.setState({ status: 'bootstrapping', user: null, session: null, tokens: null });
    await useAuthStore.getState().initialize();
    expect(useAuthStore.getState().status).toBe('pending-approval');
  });

  it('refreshSession → a pending vet flips to "authenticated" once the admin approves', async () => {
    me.mockResolvedValueOnce({ ...snapshot, accessState: 'VETERINARIAN_APPROVAL_REQUIRED' });
    await useAuthStore.getState().login({ email: 'a', password: 'b' });
    expect(useAuthStore.getState().status).toBe('pending-approval');

    me.mockResolvedValueOnce({ ...snapshot, accessState: 'FULL' });
    await useAuthStore.getState().refreshSession();
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('a pending-approval session is torn down on logout like any other', async () => {
    me.mockResolvedValueOnce({ ...snapshot, accessState: 'VETERINARIAN_APPROVAL_REQUIRED' });
    await useAuthStore.getState().login({ email: 'a', password: 'b' });
    await useAuthStore.getState().logout();
    expect(logout).toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });
});
