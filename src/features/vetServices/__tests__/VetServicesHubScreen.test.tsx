import { useAuthStore } from '@/features/auth/store';
import type { SessionSnapshot } from '@/features/auth/types';
import { renderWithProviders, screen, fireEvent } from '@/test-utils/render';
import { resetRouterMock, expoRouter } from '@/test-utils/routerMock';

import VetServicesHubScreen from '../screens/VetServicesHubScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function session(overrides: Partial<SessionSnapshot>): SessionSnapshot {
  return {
    user: {
      id: 'me',
      email: 'me@example.test',
      firstName: 'نورة',
      lastName: 'القحطاني',
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
    ...overrides,
  };
}

beforeEach(() => resetRouterMock());
afterAll(() => useAuthStore.setState({ session: null }));

describe('VetServicesHubScreen', () => {
  it('a pet owner sees the two public entries and can open the listings browse', () => {
    useAuthStore.setState({ session: session({}) });
    renderWithProviders(<VetServicesHubScreen />);

    expect(screen.getByText('خدمات الأطباء')).toBeTruthy();
    expect(screen.getByText('طلبات أصحاب الحيوانات')).toBeTruthy();
    // "My Services" is vet-only.
    expect(screen.queryByText('خدماتي')).toBeNull();

    fireEvent.press(screen.getByText('تصفّح الخدمات'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/vet-services/listings');
  });

  it('an approved veterinarian additionally sees "خدماتي"', () => {
    const s = session({ roles: ['PET_OWNER', 'VETERINARIAN'] });
    s.user.veterinarianStatus = 'APPROVED';
    s.veterinarian = { status: 'APPROVED', approved: true };
    useAuthStore.setState({ session: s });
    renderWithProviders(<VetServicesHubScreen />);

    expect(screen.getByText('خدماتي')).toBeTruthy();
    fireEvent.press(screen.getByText('إدارة خدماتي'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/vet-services/my');
  });
});
