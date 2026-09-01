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
    createdAt: '',
    updatedAt: '',
  },
  roles: ['PET_OWNER'],
  permissions: [],
  isAdmin: false,
  supervisorDomains: [],
  veterinarian: { status: 'NOT_APPLIED', approved: false },
  ...over,
});

function setAuth(
  status: 'bootstrapping' | 'authenticated' | 'unauthenticated',
  snap?: SessionSnapshot,
) {
  useAuthStore.setState({
    status,
    session: snap ?? null,
    user: snap?.user ?? null,
    tokens:
      status === 'authenticated'
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
