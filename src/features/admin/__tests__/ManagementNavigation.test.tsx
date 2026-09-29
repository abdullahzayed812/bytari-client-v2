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
  getDashboardSummary
    .mockReset()
    .mockResolvedValue({ cards: [], recentActivity: [], pendingTasks: [] });
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

  it('Courses and Seminars share one unified card that opens the combined moderation screen', () => {
    useAuthStore.setState({ session: session({ isAdmin: true, roles: ['ADMIN', 'PET_OWNER'] }) });
    renderWithProviders(<ManagementScreen />);

    expect(screen.getAllByText('الدورات والندوات')).toHaveLength(1);
    expect(screen.queryByText('الدورات')).toBeNull();
    expect(screen.queryByText('الندوات')).toBeNull();

    fireEvent.press(screen.getByText('الدورات والندوات'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/admin/vet-courses');
  });
  it('Adoption, Mating and Lost share one card that opens the combined tabbed screen', () => {
    useAuthStore.setState({ session: session({ isAdmin: true, roles: ['ADMIN', 'PET_OWNER'] }) });
    renderWithProviders(<ManagementScreen />);

    expect(screen.getAllByText('التبني والتزاوج والحيوانات المفقودة')).toHaveLength(1);
    expect(screen.queryByText('التبني')).toBeNull();
    expect(screen.queryByText('التزاوج')).toBeNull();
    expect(screen.queryByText('الحيوانات المفقودة')).toBeNull();

    fireEvent.press(screen.getByText('التبني والتزاوج والحيوانات المفقودة'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/admin/animal-publications');
  });

  it('Books and Magazines share one card that opens the combined tabbed screen', () => {
    useAuthStore.setState({ session: session({ isAdmin: true, roles: ['ADMIN', 'PET_OWNER'] }) });
    renderWithProviders(<ManagementScreen />);

    expect(screen.getAllByText('الكتب والمجلات')).toHaveLength(1);
    expect(screen.queryByText('الكتب')).toBeNull();
    expect(screen.queryByText('المجلات')).toBeNull();

    fireEvent.press(screen.getByText('الكتب والمجلات'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/admin/content-hub');
  });

  it('the combined adoption badge sums the three per-kind server counters', async () => {
    getDashboardSummary.mockResolvedValue({
      cards: [
        { id: 'adoption', count: 1, activeCount: 4 },
        { id: 'mating', count: 2, activeCount: 5 },
        { id: 'lostAnimals', count: 3, activeCount: 6 },
      ],
      recentActivity: [],
      pendingTasks: [],
    });
    useAuthStore.setState({ session: session({ supervisorDomains: ['ANIMAL'] }) });
    renderWithProviders(<ManagementScreen />);

    expect(await screen.findByText('15')).toBeTruthy();
    expect(screen.getByText('6')).toBeTruthy();
  });

  it('section gating is unchanged: an ANIMAL supervisor sees the adoption card but not Books & Magazines', () => {
    useAuthStore.setState({ session: session({ supervisorDomains: ['ANIMAL'] }) });
    renderWithProviders(<ManagementScreen />);
    expect(screen.getByText('التبني والتزاوج والحيوانات المفقودة')).toBeTruthy();
    expect(screen.queryByText('الكتب والمجلات')).toBeNull();
  });

  it('a CONTENT supervisor sees Books & Magazines but not the adoption card', () => {
    useAuthStore.setState({ session: session({ supervisorDomains: ['CONTENT'] }) });
    renderWithProviders(<ManagementScreen />);
    expect(screen.getByText('الكتب والمجلات')).toBeTruthy();
    expect(screen.queryByText('التبني والتزاوج والحيوانات المفقودة')).toBeNull();
  });
});
