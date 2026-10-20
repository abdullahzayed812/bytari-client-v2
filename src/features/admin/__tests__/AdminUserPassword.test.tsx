import { useAuthStore } from '@/features/auth/store';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

import { adminApi } from '../api';
import AdminUserDetailScreen from '../screens/AdminUserDetailScreen';
import type { AdminUserDetail } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const TARGET: AdminUserDetail = {
  id: 'u2',
  email: 'rana@example.test',
  firstName: 'رنا',
  lastName: 'خالد',
  phone: null,
  status: 'ACTIVE',
  veterinarianStatus: 'NOT_APPLIED',
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  roles: ['PET_OWNER'],
  veterinarianApplication: null,
  organizations: [],
} as unknown as AdminUserDetail;

function seed(opts: { isAdmin: boolean; permissions: string[] }) {
  useAuthStore.setState({
    session: {
      user: {
        id: 'staff1',
        email: 'staff@x.c',
        firstName: 'م',
        lastName: 'ع',
        phone: null,
        status: 'ACTIVE',
        veterinarianStatus: 'NOT_APPLIED',
        traderStatus: 'NOT_REGISTERED' as const,
        createdAt: '',
        updatedAt: '',
      },
      roles: opts.isAdmin ? ['ADMIN'] : ['MODERATOR'],
      permissions: opts.permissions,
      isAdmin: opts.isAdmin,
      supervisorDomains: [],
      veterinarian: { status: 'NOT_APPLIED', approved: false },
      trader: { status: 'NOT_REGISTERED', approved: false },
    },
  } as never);
}

const SET_CTA = 'تعيين كلمة مرور جديدة';
const NEW_PASSWORD = 'admin-chosen-password-42';

describe('Admin user detail — password management', () => {
  const getUser = jest.spyOn(adminApi, 'getUser');
  const setUserPassword = jest.spyOn(adminApi, 'setUserPassword');

  beforeEach(() => {
    resetRouterMock();
    setSearchParams({ userId: 'u2' });
    getUser.mockReset().mockResolvedValue(TARGET);
    setUserPassword.mockReset().mockResolvedValue({ userId: 'u2', revokedSessions: 2 } as never);
  });
  afterAll(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ session: null });
  });

  it('is hidden from a viewer with user.read but no user.update (the server would 403)', async () => {
    seed({ isAdmin: false, permissions: ['user.read'] });
    renderWithProviders(<AdminUserDetailScreen />);
    expect((await screen.findAllByText('rana@example.test')).length).toBeGreaterThan(0);
    expect(screen.queryByText('كلمة المرور')).toBeNull();
    expect(screen.queryByText(SET_CTA)).toBeNull();
  });

  it('never shows a current password; sets a new one only after it is confirmed', async () => {
    seed({ isAdmin: true, permissions: [] });
    renderWithProviders(<AdminUserDetailScreen />);
    expect(await screen.findByText('كلمة المرور')).toBeOnTheScreen();
    expect(screen.getByText(/لا يمكن عرض كلمة المرور الحالية/)).toBeOnTheScreen();

    fireEvent.press(screen.getByText(SET_CTA));
    fireEvent.changeText(
      await screen.findByLabelText('كلمة المرور الجديدة (10 أحرف على الأقل)'),
      NEW_PASSWORD,
    );
    fireEvent.changeText(screen.getByLabelText('تأكيد كلمة المرور الجديدة'), 'something-else-1');
    expect(screen.getByText('كلمتا المرور غير متطابقتين.')).toBeOnTheScreen();
    // the dialog's confirm button is the last one labelled like the CTA
    const confirmButton = () => screen.getAllByRole('button', { name: SET_CTA }).at(-1)!;
    expect(confirmButton()).toBeDisabled();

    fireEvent.changeText(screen.getByLabelText('تأكيد كلمة المرور الجديدة'), NEW_PASSWORD);
    expect(confirmButton()).toBeEnabled();
    fireEvent.press(confirmButton());
    await waitFor(() => expect(setUserPassword).toHaveBeenCalledWith('u2', NEW_PASSWORD));
  });
});
