import { useAuthStore } from '@/features/auth/store';
import { farmApi } from '@/features/farmShared';
import { organizationsApi } from '@/features/organizations/api';
import JoinFarmScreen from '@/features/farmShared/screens/JoinFarmScreen';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function seedVet(status: 'APPROVED' | 'PENDING' | 'NOT_APPLIED') {
  useAuthStore.setState({
    session: {
      user: {
        id: 'u1',
        email: 'v@x.c',
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

describe('JoinFarmScreen (§9 — no approval step)', () => {
  const join = jest.spyOn(farmApi, 'joinByCode');
  const listMine = jest.spyOn(organizationsApi, 'listMine');

  beforeEach(() => {
    resetRouterMock();
    join.mockReset();
    listMine.mockReset().mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 50, total: 0, totalPages: 1 },
    });
  });
  afterAll(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ session: null });
  });

  it('a non-approved veterinarian sees the gate, not the form', () => {
    seedVet('PENDING');
    renderWithProviders(<JoinFarmScreen />);
    expect(
      screen.getByText('يجب أن تكون طبيباً بيطرياً معتمَداً للانضمام إلى مزرعة.'),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'الانضمام إلى المزرعة' })).toBeNull();
  });

  it('rejects a too-short code client-side and never calls the API', async () => {
    seedVet('APPROVED');
    renderWithProviders(<JoinFarmScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('مثال: FARM-8F3K9Q'), 'ab');
    fireEvent.press(screen.getByRole('button', { name: 'الانضمام إلى المزرعة' }));
    await waitFor(() => expect(screen.getByText('رمز الانضمام قصير جداً.')).toBeOnTheScreen());
    expect(join).not.toHaveBeenCalled();
  });

  it('joins with an upper-cased code then navigates to the farm', async () => {
    seedVet('APPROVED');
    join.mockResolvedValueOnce({ id: 'm1', organizationId: 'farm-1' } as never);
    renderWithProviders(<JoinFarmScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('مثال: FARM-8F3K9Q'), 'farm-abcd12');
    fireEvent.press(screen.getByRole('button', { name: 'الانضمام إلى المزرعة' }));

    await waitFor(() => expect(join).toHaveBeenCalledWith({ joinCode: 'FARM-ABCD12' }));
    await waitFor(() =>
      expect(routerMock.replace).toHaveBeenCalledWith('/(app)/organizations/farm-1'),
    );
  });

  it('maps INVALID_JOIN_CODE to a safe Arabic message (raw text never shown)', async () => {
    seedVet('APPROVED');
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    join.mockRejectedValueOnce(
      new ApiError({ code: 'INVALID_JOIN_CODE' as never, message: 'bad code lookup', status: 404 }),
    );
    renderWithProviders(<JoinFarmScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('مثال: FARM-8F3K9Q'), 'FARM-ZZZZ99');
    fireEvent.press(screen.getByRole('button', { name: 'الانضمام إلى المزرعة' }));
    await waitFor(() => expect(screen.getByText('رمز انضمام غير صحيح.')).toBeOnTheScreen());
    expect(screen.queryByText('bad code lookup')).toBeNull();
  });
});
