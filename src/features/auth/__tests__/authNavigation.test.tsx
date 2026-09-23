import { render } from '@testing-library/react-native';

import { AuthRedirector } from '@/navigation/AuthRedirector';

import { useAuthStore } from '../store';
import type { SessionSnapshot } from '../types';

const mockReplace = jest.fn();
let mockSegments: string[] = [];

jest.mock('expo-router', () => ({
  router: { replace: (...a: unknown[]) => mockReplace(...a) },
  useSegments: () => mockSegments,
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
  status: 'bootstrapping' | 'authenticated' | 'unauthenticated' | 'pending-approval' | 'pending-verification',
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
  ])('pending vet on %j (manual navigation / restart) → pinned to the pending screen', (segments) => {
    setAuth('pending-approval', pendingVet());
    mockSegments = segments;
    render(<AuthRedirector />);
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/veterinarian-pending');
  });

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

  it('approved vet on the pending screen → moved into the app', () => {
    setAuth('authenticated', session({ accessState: 'FULL' }));
    mockSegments = ['(auth)', 'veterinarian-pending'];
    render(<AuthRedirector />);
    expect(mockReplace).toHaveBeenCalledWith('/(app)/(tabs)');
  });
});
