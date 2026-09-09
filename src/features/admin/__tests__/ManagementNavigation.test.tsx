import { useAuthStore } from '@/features/auth/store';
import type { SessionSnapshot } from '@/features/auth/types';
import ManagementScreen from '@/features/management/screens/ManagementScreen';
import { renderWithProviders, screen, fireEvent } from '@/test-utils/render';
import { resetRouterMock, expoRouter } from '@/test-utils/routerMock';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

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

beforeEach(() => resetRouterMock());
afterAll(() => useAuthStore.setState({ session: null }));

describe('Management Centre — role/permission-gated admin navigation', () => {
  it('an ADMIN sees every admin area and can open Users', () => {
    useAuthStore.setState({ session: session({ isAdmin: true, roles: ['ADMIN', 'PET_OWNER'] }) });
    renderWithProviders(<ManagementScreen />);

    expect(screen.getByText('المستخدمون والأدوار')).toBeTruthy();
    expect(screen.getByText('طلبات اعتماد الأطباء')).toBeTruthy();
    expect(screen.getByText('المؤسسات')).toBeTruthy();
    expect(screen.getByText('المشرفون')).toBeTruthy();
    expect(screen.getByText('سجل التدقيق')).toBeTruthy();

    fireEvent.press(screen.getByText('المستخدمون والأدوار'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/admin/users');
  });

  it('a user with only user.read sees Users but not the audit log', () => {
    useAuthStore.setState({
      session: session({ isAdmin: false, permissions: ['user.read'] }),
    });
    renderWithProviders(<ManagementScreen />);

    expect(screen.getByText('المستخدمون والأدوار')).toBeTruthy();
    expect(screen.queryByText('سجل التدقيق')).toBeNull();
  });

  it('a VET_SERVICE supervisor sees the vet-service moderation queues and can open one', () => {
    useAuthStore.setState({
      session: session({ supervisorDomains: ['VET_SERVICE'] }),
    });
    renderWithProviders(<ManagementScreen />);

    expect(screen.getByText('مراجعة خدمات الأطباء')).toBeTruthy();
    expect(screen.getByText('مراجعة طلبات أصحاب الحيوانات')).toBeTruthy();
    expect(screen.queryByText('المستخدمون والأدوار')).toBeNull();

    fireEvent.press(screen.getByText('مراجعة خدمات الأطباء'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/admin/vet-service-listings');
  });

  it('a plain pet owner sees no admin areas', () => {
    useAuthStore.setState({ session: session({}) });
    renderWithProviders(<ManagementScreen />);

    expect(screen.queryByText('المستخدمون والأدوار')).toBeNull();
    expect(screen.queryByText('المؤسسات')).toBeNull();
  });
});
