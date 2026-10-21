import { act, render } from '@testing-library/react-native';

import { AuthRedirector } from '@/navigation/AuthRedirector';

import { authApi } from '../api';
import { tokenStorage } from '../services';
import { useAuthStore } from '../store';
import type { SessionSnapshot } from '../types';

const mockReplace = jest.fn();
let mockSegments: string[] = [];
// The navigation container's root state: has the root <Stack> registered yet?
let mockRootStackMounted = true;
const mockStateListeners = new Set<() => void>();
const mockNavRef = {
  isReady: () => true,
  getRootState: () => ({
    index: 0,
    routes: [
      { name: '__root', state: mockRootStackMounted ? { index: 0, routes: [] } : undefined },
    ],
  }),
  addListener: (_e: string, l: () => void) => {
    mockStateListeners.add(l);
    return () => mockStateListeners.delete(l);
  },
};

jest.mock('expo-router', () => ({
  router: { replace: (...a: unknown[]) => mockReplace(...a) },
  useSegments: () => mockSegments,
  usePathname: () => '/',
  useNavigationContainerRef: () => mockNavRef,
}));

const session = (over: Partial<SessionSnapshot> = {}): SessionSnapshot => ({
  user: {
    id: 'u',
    email: 'e@x.c',
    firstName: 'F',
    lastName: 'L',
    phone: null,
    status: 'ACTIVE',
    veterinarianStatus: 'NOT_APPLIED',
    traderStatus: 'NOT_REGISTERED' as const,
    createdAt: '',
    updatedAt: '',
  },
  roles: ['PET_OWNER'],
  permissions: [],
  isAdmin: false,
  supervisorDomains: [],
  veterinarian: { status: 'NOT_APPLIED', approved: false },
  trader: { status: 'NOT_REGISTERED', approved: false },
  ...over,
});

function setAuth(
  status:
    | 'bootstrapping'
    | 'authenticated'
    | 'unauthenticated'
    | 'pending-approval'
    | 'pending-verification',
  snap?: SessionSnapshot,
) {
  useAuthStore.setState({
    status,
    session: snap ?? null,
    user: snap?.user ?? null,
    tokens:
      status !== 'unauthenticated' && status !== 'bootstrapping'
        ? { accessToken: 'a', refreshToken: 'r', tokenType: 'Bearer', expiresIn: 900 }
        : null,
  });
}

describe('AuthRedirector — navigation guards (§24)', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockSegments = [];
  });

  it('unauthenticated inside (app) → redirected to the auth flow', () => {
    setAuth('unauthenticated');
    mockSegments = ['(app)', '(tabs)'];
    render(<AuthRedirector />);
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/sign-in');
  });

  it('authenticated inside (auth) → redirected to the app', () => {
    setAuth('authenticated', session());
    mockSegments = ['(auth)', 'sign-in'];
    render(<AuthRedirector />);
    expect(mockReplace).toHaveBeenCalledWith('/(app)/(tabs)');
  });

  it('waits for the root Stack to register before redirecting (no root remount → no second splash)', () => {
    setAuth('authenticated', session());
    mockSegments = [];
    mockRootStackMounted = false;
    render(<AuthRedirector />);
    // Redirecting now would REPLACE expo-router's internal root route and
    // remount the whole root layout (the splash played twice).
    expect(mockReplace).not.toHaveBeenCalled();
    act(() => {
      mockRootStackMounted = true;
      mockStateListeners.forEach((l) => l());
    });
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/(app)/(tabs)');
    mockRootStackMounted = true;
  });

  it('does nothing while bootstrapping (no flicker / race)', () => {
    setAuth('bootstrapping');
    mockSegments = ['(app)', '(tabs)'];
    render(<AuthRedirector />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('authenticated already inside (app) → left alone', () => {
    setAuth('authenticated', session());
    mockSegments = ['(app)', '(tabs)', 'account'];
    render(<AuthRedirector />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('unauthenticated on a register screen → left alone (no bounce)', () => {
    setAuth('unauthenticated');
    mockSegments = ['(auth)', 'register'];
    render(<AuthRedirector />);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe('AuthRedirector — veterinarian pending-approval gate', () => {
  const pendingVet = () =>
    session({
      accessState: 'VETERINARIAN_APPROVAL_REQUIRED',
      veterinarian: { status: 'PENDING', approved: false },
    });

  beforeEach(() => {
    mockReplace.mockClear();
    mockSegments = [];
  });

  it.each([
    [['(app)', '(tabs)']],
    [['(app)', 'vet-courses']],
    [['(app)', 'admin', 'veterinarians']],
    [['(auth)', 'sign-in']],
    [['(auth)', 'verify-email']],
    [[]],
  ])(
    'pending vet on %j (manual navigation / restart) → pinned to the pending screen',
    (segments) => {
      setAuth('pending-approval', pendingVet());
      mockSegments = segments;
      render(<AuthRedirector />);
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/veterinarian-pending');
    },
  );

  it.each([
    [['(auth)', 'veterinarian-pending']],
    [['(auth)', 'register-veterinarian']],
    [['(app)', 'veterinarian', 'apply']],
  ])('pending vet on allowed onboarding route %j → left alone', (segments) => {
    setAuth('pending-approval', pendingVet());
    mockSegments = segments;
    render(<AuthRedirector />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('unverified pet owner is still sent to verify-email, never to the vet pending screen', () => {
    setAuth('pending-verification', session({ accessState: 'EMAIL_VERIFICATION_REQUIRED' }));
    mockSegments = ['(app)', '(tabs)'];
    render(<AuthRedirector />);
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/verify-email');
  });

  it('unverified pet owner Back to the registration form → not bounced to verify-email', () => {
    setAuth('pending-verification', session({ accessState: 'EMAIL_VERIFICATION_REQUIRED' }));
    for (const screen of ['register', 'verify-email']) {
      mockReplace.mockClear();
      mockSegments = ['(auth)', screen];
      render(<AuthRedirector />);
      expect(mockReplace).not.toHaveBeenCalled();
    }
  });

  it.each([
    ['(auth)', 'welcome'],
    ['(auth)', 'sign-in'],
    ['(auth)', 'register-veterinarian'],
  ])('unverified pet owner on %s/%s → still pinned to verify-email', (...segments) => {
    setAuth('pending-verification', session({ accessState: 'EMAIL_VERIFICATION_REQUIRED' }));
    mockSegments = segments;
    render(<AuthRedirector />);
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/verify-email');
  });

  it('"تسجيل الخروج" on the pending screen clears tokens + session and lands on sign-in', async () => {
    const logoutCall = jest.spyOn(authApi, 'logout').mockResolvedValue({ success: true });
    setAuth('pending-approval', pendingVet());
    await tokenStorage.saveTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      expiresIn: 900,
    });
    mockSegments = ['(auth)', 'veterinarian-pending'];
    render(<AuthRedirector />);
    expect(mockReplace).not.toHaveBeenCalled();

    await act(() => useAuthStore.getState().logout());

    expect(logoutCall).toHaveBeenCalledWith('r');
    expect(useAuthStore.getState()).toMatchObject({
      status: 'unauthenticated',
      tokens: null,
      session: null,
    });
    expect(await tokenStorage.getStoredTokens()).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/sign-in');
    logoutCall.mockRestore();
  });

  it('signed out on another auth screen (sign-in / register / verify-email) → left alone', () => {
    for (const screen of ['sign-in', 'register', 'verify-email']) {
      setAuth('unauthenticated');
      mockSegments = ['(auth)', screen];
      render(<AuthRedirector />);
    }
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('approved vet on the pending screen → moved into the app', () => {
    setAuth('authenticated', session({ accessState: 'FULL' }));
    mockSegments = ['(auth)', 'veterinarian-pending'];
    render(<AuthRedirector />);
    expect(mockReplace).toHaveBeenCalledWith('/(app)/(tabs)');
  });
});
