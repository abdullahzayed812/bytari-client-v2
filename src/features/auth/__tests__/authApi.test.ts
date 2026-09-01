import { apiClient } from '@/services/api';

import { authApi } from '../api';

describe('authApi — endpoint wrappers', () => {
  const post = jest.spyOn(apiClient, 'post');
  const get = jest.spyOn(apiClient, 'get');

  beforeEach(() => jest.clearAllMocks());
  afterAll(() => jest.restoreAllMocks());

  it('register → POST /auth/register (anonymous)', async () => {
    post.mockResolvedValueOnce({ user: {}, tokens: {} });
    await authApi.register({
      email: 'a@b.c',
      password: 'longenough1',
      firstName: 'A',
      lastName: 'B',
    });
    expect(post).toHaveBeenCalledWith('/auth/register', expect.any(Object), { anonymous: true });
  });

  it('login → POST /auth/login (anonymous)', async () => {
    post.mockResolvedValueOnce({ user: {}, tokens: {} });
    await authApi.login({ email: 'a@b.c', password: 'x' });
    expect(post).toHaveBeenCalledWith(
      '/auth/login',
      { email: 'a@b.c', password: 'x' },
      { anonymous: true },
    );
  });

  it('refresh → POST /auth/refresh (anonymous, skipAuthRefresh) and returns { tokens }', async () => {
    post.mockResolvedValueOnce({ tokens: { accessToken: 'a' } });
    const result = await authApi.refresh('r1');
    expect(post).toHaveBeenCalledWith(
      '/auth/refresh',
      { refreshToken: 'r1' },
      {
        anonymous: true,
        skipAuthRefresh: true,
      },
    );
    expect(result).toEqual({ tokens: { accessToken: 'a' } });
  });

  it('logout → POST /auth/logout with the refresh token in the body', async () => {
    post.mockResolvedValueOnce({ success: true });
    await authApi.logout('r1');
    expect(post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'r1' });
  });

  it('logout without a token → empty body', async () => {
    post.mockResolvedValueOnce({ success: true });
    await authApi.logout();
    expect(post).toHaveBeenCalledWith('/auth/logout', {});
  });

  it('logoutAll → POST /auth/logout-all (authenticated)', async () => {
    post.mockResolvedValueOnce({ success: true, revokedSessions: 3 });
    await authApi.logoutAll();
    expect(post).toHaveBeenCalledWith('/auth/logout-all');
  });

  it('me → GET /auth/me', async () => {
    get.mockResolvedValueOnce({ user: {}, roles: [], permissions: [] });
    await authApi.me();
    expect(get).toHaveBeenCalledWith('/auth/me');
  });
});
