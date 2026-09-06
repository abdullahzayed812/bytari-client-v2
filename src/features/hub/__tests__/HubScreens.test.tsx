import { useAuthStore } from '@/features/auth/store';
import type { SessionSnapshot } from '@/features/auth/types';
import { renderWithProviders, screen, fireEvent } from '@/test-utils/render';
import { resetRouterMock, expoRouter } from '@/test-utils/routerMock';

import MoreHubScreen from '../screens/MoreHubScreen';
import ServicesHubScreen from '../screens/ServicesHubScreen';

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

describe('ServicesHubScreen — no dead ends, capability-aware', () => {
  it('a pet owner sees core services and can open Consultations', () => {
    useAuthStore.setState({ session: session({}) });
    renderWithProviders(<ServicesHubScreen />);

    expect(screen.getByText('الاستشارات')).toBeTruthy();
    expect(screen.getByText('المكتبة المعرفية')).toBeTruthy();
    expect(screen.getByText('كن طبيباً بيطرياً')).toBeTruthy();
    // Vet-only entries hidden for a non-vet:
    expect(screen.queryByText('الاستفسارات')).toBeNull();

    fireEvent.press(screen.getByText('الاستشارات'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/support/consultations');
  });

  it('an approved vet additionally sees Inquiries and Join-farm', () => {
    const s = session({ roles: ['PET_OWNER', 'VETERINARIAN'] });
    s.user.veterinarianStatus = 'APPROVED';
    s.veterinarian = { status: 'APPROVED', approved: true };
    useAuthStore.setState({ session: s });
    renderWithProviders(<ServicesHubScreen />);

    expect(screen.getByText('الاستفسارات')).toBeTruthy();
    expect(screen.getByText('الانضمام إلى مزرعة')).toBeTruthy();
    expect(screen.queryByText('كن طبيباً بيطرياً')).toBeNull();
  });
});

describe('MoreHubScreen', () => {
  it('shows account utilities; Management only for admins', () => {
    useAuthStore.setState({ session: session({}) });
    const { rerender } = renderWithProviders(<MoreHubScreen />);

    expect(screen.getByText('الإشعارات')).toBeTruthy();
    expect(screen.queryByText('مركز الإدارة')).toBeNull();

    useAuthStore.setState({ session: session({ isAdmin: true }) });
    rerender(<MoreHubScreen />);
    expect(screen.getByText('مركز الإدارة')).toBeTruthy();

    fireEvent.press(screen.getByText('الإشعارات'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/notifications');
  });
});
