import { adminApi } from '@/features/admin/api';
import { useAuthStore } from '@/features/auth/store';
import type { SessionSnapshot } from '@/features/auth/types';
import ManagementScreen from '@/features/management/screens/ManagementScreen';
import { renderWithProviders, screen, fireEvent } from '@/test-utils/render';
import { resetRouterMock, expoRouter } from '@/test-utils/routerMock';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const getDashboardSummary = jest.spyOn(adminApi, 'getDashboardSummary');

function session(overrides: Partial<SessionSnapshot>): SessionSnapshot {
  return {
    user: {
      id: 'me',
      email: 'me@example.test',
      firstName: 'سالم',
      lastName: 'العتيبي',
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

beforeEach(() => {
  resetRouterMock();
  getDashboardSummary.mockReset().mockResolvedValue({ cards: [], recentActivity: [], pendingTasks: [] });
});
afterAll(() => {
  useAuthStore.setState({ session: null });
  jest.restoreAllMocks();
});

describe('Admin dashboard — role/permission-gated navigation', () => {
  it('an ADMIN sees every admin card and can open Users', () => {
    useAuthStore.setState({ session: session({ isAdmin: true, roles: ['ADMIN', 'PET_OWNER'] }) });
    renderWithProviders(<ManagementScreen />);

    expect(screen.getByText('إدارة المستخدمين')).toBeTruthy();
    expect(screen.getByText('موافقة الأطباء البيطريين')).toBeTruthy();
    expect(screen.getByText('العيادات')).toBeTruthy();
    expect(screen.getByText('المشرفين')).toBeTruthy();
    expect(screen.getByText('إرسال رسالة')).toBeTruthy();

    fireEvent.press(screen.getByText('إدارة المستخدمين'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/admin/users');
  });

  it('a user with only user.read sees the user cards but not the admin-only broadcast card', () => {
    useAuthStore.setState({
      session: session({ isAdmin: false, permissions: ['user.read'] }),
    });
    renderWithProviders(<ManagementScreen />);

    expect(screen.getByText('إدارة المستخدمين')).toBeTruthy();
    expect(screen.queryByText('إرسال رسالة')).toBeNull();
  });

  it('a VET_SERVICE supervisor sees the combined services card and can open it', () => {
    useAuthStore.setState({
      session: session({ supervisorDomains: ['VET_SERVICE'] }),
    });
    renderWithProviders(<ManagementScreen />);

    expect(screen.getByText('الخدمات')).toBeTruthy();
    expect(screen.queryByText('إدارة المستخدمين')).toBeNull();

    fireEvent.press(screen.getByText('الخدمات'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/admin/services-hub');
  });

  it('a plain pet owner sees no admin cards', () => {
    useAuthStore.setState({ session: session({}) });
    renderWithProviders(<ManagementScreen />);

    expect(screen.queryByText('إدارة المستخدمين')).toBeNull();
    expect(screen.queryByText('العيادات')).toBeNull();
  });
});
