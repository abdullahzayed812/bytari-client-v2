import { ApiError } from '@/services/api/errors';
import { authService, type AuthResult, type SessionSnapshot } from '@/services/auth';
import { clearTokens, saveTokens } from '@/services/auth/tokenStorage';
import { useAuthStore } from '@/store/authStore';

const meResponse: SessionSnapshot = {
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

const loginResult: AuthResult = {
  user: meResponse.user,
  tokens: { accessToken: 'a1', refreshToken: 'r1', tokenType: 'Bearer', expiresIn: 900 },
};

describe('auth store transitions', () => {
  const me = jest.spyOn(authService, 'me');
  const login = jest.spyOn(authService, 'login');
  const refresh = jest.spyOn(authService, 'refresh');
  const logout = jest.spyOn(authService, 'logout');

  beforeEach(async () => {
    await clearTokens();
    useAuthStore.setState({
      status: 'idle',
      user: null,
      session: null,
      tokens: null,
      lastError: null,
    });
    jest.clearAllMocks();
    me.mockResolvedValue(meResponse);
    login.mockResolvedValue(loginResult);
    refresh.mockResolvedValue(loginResult);
    logout.mockResolvedValue({ success: true });
  });

  afterAll(() => jest.restoreAllMocks());

  it('bootstraps to "unauthenticated" when no tokens are stored', async () => {
    await useAuthStore.getState().bootstrap();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(me).not.toHaveBeenCalled();
  });

  it('bootstraps to "authenticated" when stored tokens are still valid', async () => {
    await saveTokens(loginResult.tokens);
    await useAuthStore.getState().bootstrap();
    expect(me).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().session?.user.id).toBe('u1');
  });

  it('signs in: unauthenticated → authenticated with a session snapshot', async () => {
    await useAuthStore.getState().signIn({ email: 'vet@example.com', password: 'x' });
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().tokens?.accessToken).toBe('a1');
    expect(useAuthStore.getState().session?.veterinarian.approved).toBe(true);
  });

  it('signs out: authenticated → unauthenticated and clears tokens', async () => {
    await useAuthStore.getState().signIn({ email: 'vet@example.com', password: 'x' });
    await useAuthStore.getState().signOut();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().tokens).toBeNull();
    expect(logout).toHaveBeenCalled();
  });

  it('recovers an expired access token via one refresh during bootstrap', async () => {
    await saveTokens({
      accessToken: 'old',
      refreshToken: 'r-old',
      tokenType: 'Bearer',
      expiresIn: 900,
    });
    me.mockRejectedValueOnce(
      new ApiError({ code: 'INVALID_TOKEN', message: 'expired', status: 401 }),
    ).mockResolvedValueOnce(meResponse);

    await useAuthStore.getState().bootstrap();
    expect(refresh).toHaveBeenCalledWith('r-old');
    expect(useAuthStore.getState().status).toBe('authenticated');
  });
});
