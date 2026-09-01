import { Routes } from '@/constants/routes';
import { useAuthStore } from '@/features/auth/store';
import { notificationsApi } from '@/features/notifications/api/notificationsApi';
import { petsApi } from '@/features/pets';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import HomeScreen from '@/features/home/screens/HomeScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
jest.mock('@/services/realtime', () => ({
  realtimeClient: { on: jest.fn(() => ({ unsubscribe: jest.fn() })) },
}));

function authed() {
  const user = {
    id: 'u1',
    email: 'u@x.c',
    firstName: 'ر',
    lastName: 'ز',
    phone: null,
    status: 'ACTIVE' as const,
    veterinarianStatus: 'NOT_APPLIED' as const,
    createdAt: '',
    updatedAt: '',
  };
  useAuthStore.setState({
    user,
    status: 'authenticated',
    session: {
      user,
      roles: ['PET_OWNER'],
      permissions: [],
      isAdmin: false,
      supervisorDomains: [],
      veterinarian: { status: 'NOT_APPLIED', approved: false },
    },
  });
}

beforeEach(() => {
  resetRouterMock();
  setSearchParams({});
  authed();
  jest.spyOn(petsApi, 'list').mockResolvedValue({
    items: [],
    meta: { page: 1, pageSize: 3, total: 0, totalPages: 1 },
  });
});
afterEach(() => jest.restoreAllMocks());
afterAll(() => useAuthStore.setState({ session: null, user: null, status: 'unauthenticated' }));

describe('notifications route', () => {
  it('is an absolute deep-link-safe path', () => {
    expect(Routes.notifications).toBe('/(app)/notifications');
  });
});

describe('Pet Owner Home — notifications entry', () => {
  it('shows the unread badge on the header bell icon and navigates to the inbox', async () => {
    jest.spyOn(notificationsApi, 'unreadCount').mockResolvedValue(4);

    renderWithProviders(<HomeScreen />);

    // unread badge from GET /notifications/unread-count reflected in the a11y label
    const bell = await screen.findByLabelText('الإشعارات، 4 غير مقروءة');
    fireEvent.press(bell);
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/notifications');
  });

  it('falls back to the plain label when there are no unread notifications', async () => {
    jest.spyOn(notificationsApi, 'unreadCount').mockResolvedValue(0);
    renderWithProviders(<HomeScreen />);
    await waitFor(() => expect(screen.getByLabelText('الإشعارات')).toBeOnTheScreen());
  });
});
