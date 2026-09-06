import { useAuthStore } from '@/features/auth/store';
import type { VeterinarianStatus } from '@/features/auth/types';
import { organizationsApi } from '@/features/organizations';
import { renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock } from '@/test-utils/routerMock';

import { veterinarianApi } from '../api';
import VeterinarianHomeScreen from '../screens/VeterinarianHomeScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function seed(status: VeterinarianStatus) {
  useAuthStore.setState({
    session: {
      user: {
        id: 'u1',
        email: 'e@x.c',
        firstName: 'ريم',
        lastName: 'أحمد',
        phone: null,
        status: 'ACTIVE',
        veterinarianStatus: status,
        traderStatus: 'NOT_REGISTERED' as const,
        createdAt: '',
        updatedAt: '',
      },
      roles: status === 'APPROVED' ? ['PET_OWNER', 'VETERINARIAN'] : ['PET_OWNER'],
      permissions: [],
      isAdmin: false,
      supervisorDomains: [],
      veterinarian: { status, approved: status === 'APPROVED' },
      trader: { status: 'NOT_REGISTERED', approved: false },
    },
  });
}

describe('VeterinarianHomeScreen (§25) — capability-aware, backend authoritative', () => {
  const listMine = jest.spyOn(organizationsApi, 'listMine');
  const myStatus = jest.spyOn(veterinarianApi, 'myStatus');

  beforeEach(() => {
    resetRouterMock();
    listMine.mockReset().mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 1, total: 3, totalPages: 3 },
    });
    myStatus.mockReset().mockResolvedValue({ veterinarianStatus: 'PENDING', application: null });
  });
  afterAll(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ session: null });
  });

  it('APPROVED → shows organization management with the org count', async () => {
    seed('APPROVED');
    renderWithProviders(<VeterinarianHomeScreen />);
    await waitFor(() => expect(screen.getByText('مؤسساتي')).toBeOnTheScreen());
    await waitFor(() => expect(screen.getByText('3 مؤسسة')).toBeOnTheScreen());
    expect(screen.getByText('معتمَد')).toBeOnTheScreen();
  });

  it('PENDING → shows the pending hint and no organization section', async () => {
    seed('PENDING');
    renderWithProviders(<VeterinarianHomeScreen />);
    await waitFor(() =>
      expect(screen.getByText('طلب اعتمادك قيد المراجعة من فريق الإدارة.')).toBeOnTheScreen(),
    );
    expect(screen.queryByText('مؤسساتي')).toBeNull();
  });

  it('REJECTED → surfaces the rejection reason and a re-apply CTA', async () => {
    seed('REJECTED');
    myStatus.mockResolvedValue({
      veterinarianStatus: 'REJECTED',
      application: {
        id: 'a1',
        userId: 'u1',
        status: 'REJECTED',
        note: null,
        decidedBy: 'admin',
        decidedAt: '',
        decisionReason: 'الوثائق غير مكتملة',
        createdAt: '',
        updatedAt: '',
      },
    });
    renderWithProviders(<VeterinarianHomeScreen />);
    await waitFor(() => expect(screen.getByText('السبب: الوثائق غير مكتملة')).toBeOnTheScreen());
    expect(screen.getByText('تقديم طلب جديد')).toBeOnTheScreen();
  });

  it('never-applied → shows the apply CTA', async () => {
    seed('NOT_APPLIED');
    renderWithProviders(<VeterinarianHomeScreen />);
    await waitFor(() => expect(screen.getByText('تقديم طلب الاعتماد')).toBeOnTheScreen());
  });
});
