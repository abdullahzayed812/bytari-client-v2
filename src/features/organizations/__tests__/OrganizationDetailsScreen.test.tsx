import { useAuthStore } from '@/features/auth/store';
import type { SessionSnapshot } from '@/features/auth/types';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { organizationsApi } from '../api';
import OrganizationDetailsScreen from '../screens/OrganizationDetailsScreen';
import type { OrganizationDetail } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function seedSession(over: Partial<SessionSnapshot> = {}) {
  useAuthStore.setState({
    session: {
      user: {
        id: 'u1',
        email: 'e@x.c',
        firstName: 'ريم',
        lastName: 'أحمد',
        phone: null,
        status: 'ACTIVE',
        veterinarianStatus: 'APPROVED',
        traderStatus: 'NOT_REGISTERED' as const,
        createdAt: '',
        updatedAt: '',
      },
      roles: ['PET_OWNER', 'VETERINARIAN'],
      permissions: [],
      isAdmin: false,
      supervisorDomains: [],
      veterinarian: { status: 'APPROVED', approved: true },
      trader: { status: 'NOT_REGISTERED', approved: false },
      ...over,
    },
  });
}

const base: OrganizationDetail = {
  id: 'o1',
  type: 'CLINIC',
  name: 'عيادة الرحمة',
  description: 'وصف',
  ownerUserId: 'u1',
  status: 'ACTIVE',
  decidedBy: null,
  decidedAt: null,
  decisionReason: null,
  createdAt: '',
  updatedAt: '',
  details: {},
  myRole: 'OWNER',
};

describe('OrganizationDetailsScreen (§26)', () => {
  const get = jest.spyOn(organizationsApi, 'get');

  beforeEach(() => {
    resetRouterMock();
    get.mockReset();
    setSearchParams({ organizationId: 'o1' });
    seedSession();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ session: null });
  });

  it('an OWNER sees the manage entries (members / supervisors / edit)', async () => {
    get.mockResolvedValue(base);
    renderWithProviders(<OrganizationDetailsScreen />);
    await waitFor(() => expect(screen.getByText('عيادة الرحمة')).toBeOnTheScreen());
    expect(screen.getByText('الأعضاء')).toBeOnTheScreen();
    expect(screen.getByText('المشرفون')).toBeOnTheScreen();
  });

  it('a STAFF member sees no management entries', async () => {
    get.mockResolvedValue({ ...base, myRole: 'STAFF' });
    renderWithProviders(<OrganizationDetailsScreen />);
    await waitFor(() => expect(screen.getByText('عيادة الرحمة')).toBeOnTheScreen());
    expect(screen.getByText('ليست لديك صلاحيات إدارية في هذه المؤسسة.')).toBeOnTheScreen();
    expect(screen.queryByText('المشرفون')).toBeNull();
  });

  it('a 403 renders a plain "not available" state, never an authorization detail', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    get.mockRejectedValue(new ApiError({ code: 'FORBIDDEN', message: 'forbidden', status: 403 }));
    renderWithProviders(<OrganizationDetailsScreen />);
    await waitFor(() => expect(screen.getByText('المؤسسة غير متاحة')).toBeOnTheScreen());
    expect(screen.queryByText('forbidden')).toBeNull();
  });

  it('a PENDING organization shows the "under review" notice', async () => {
    get.mockResolvedValue({ ...base, status: 'PENDING' });
    renderWithProviders(<OrganizationDetailsScreen />);
    await waitFor(() =>
      expect(
        screen.getByText('هذه المؤسسة بانتظار اعتماد فريق الإدارة قبل أن تصبح نشطة.'),
      ).toBeOnTheScreen(),
    );
  });

  it('OWNER → Members entry navigates to the members route', async () => {
    get.mockResolvedValue(base);
    renderWithProviders(<OrganizationDetailsScreen />);
    await waitFor(() => expect(screen.getByText('عيادة الرحمة')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('الأعضاء'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/o1/members');
  });
});
