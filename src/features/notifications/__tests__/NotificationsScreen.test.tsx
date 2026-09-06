import { useAuthStore } from '@/features/auth/store';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { notificationsApi } from '../api/notificationsApi';
import NotificationsScreen from '../screens/NotificationsScreen';
import type { AppNotification, Paginated } from '../types';

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
    traderStatus: 'NOT_REGISTERED' as const,
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
      trader: { status: 'NOT_REGISTERED', approved: false },
    },
  });
}

const notif = (over: Partial<AppNotification> = {}): AppNotification => ({
  id: 'n1',
  type: 'CONSULTATION_MESSAGE_RECEIVED',
  title: 'رد جديد على استشارتك',
  body: 'لديك رسالة جديدة.',
  data: {},
  actorUserId: null,
  entityType: 'CONSULTATION',
  entityId: 'c1',
  read: false,
  readAt: null,
  createdAt: '2026-08-28T09:00:00.000Z',
  ...over,
});

const page = (items: AppNotification[]): Paginated<AppNotification> => ({
  items,
  meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 },
});

beforeEach(() => {
  resetRouterMock();
  setSearchParams({});
  authed();
  jest.spyOn(notificationsApi, 'unreadCount').mockResolvedValue(1);
});
afterEach(() => jest.restoreAllMocks());
afterAll(() => useAuthStore.setState({ session: null, user: null, status: 'unauthenticated' }));

describe('NotificationsScreen', () => {
  it('lists notifications and opens one (marks read + deep-links)', async () => {
    const list = jest
      .spyOn(notificationsApi, 'list')
      .mockResolvedValue(page([notif({ id: 'n9' })]));
    const markRead = jest
      .spyOn(notificationsApi, 'markRead')
      .mockResolvedValue(notif({ read: true }));

    renderWithProviders(<NotificationsScreen />);
    const card = await screen.findByRole('button', { name: /رد جديد على استشارتك/ });
    fireEvent.press(card);

    await waitFor(() => expect(markRead).toHaveBeenCalledWith('n9'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/support/consultations/c1');
    expect(list).toHaveBeenCalled();
  });

  it('shows the Arabic empty state when there is nothing', async () => {
    jest.spyOn(notificationsApi, 'list').mockResolvedValue(page([]));
    renderWithProviders(<NotificationsScreen />);
    expect(await screen.findByText('لا توجد إشعارات')).toBeOnTheScreen();
  });

  it('the Unread filter re-queries with read=false and has its own empty copy', async () => {
    const list = jest
      .spyOn(notificationsApi, 'list')
      .mockImplementation((f) => Promise.resolve(page(f.read === false ? [] : [notif()])));

    renderWithProviders(<NotificationsScreen />);
    await screen.findByText('رد جديد على استشارتك');

    fireEvent.press(screen.getByText('غير المقروءة'));
    expect(await screen.findByText('لا توجد إشعارات غير مقروءة')).toBeOnTheScreen();
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ read: false }));
  });

  it('mark-all-read calls the endpoint and toasts the count', async () => {
    jest.spyOn(notificationsApi, 'list').mockResolvedValue(page([notif()]));
    const markAll = jest.spyOn(notificationsApi, 'markAllRead').mockResolvedValue({ updated: 3 });

    renderWithProviders(<NotificationsScreen />);
    await screen.findByText('رد جديد على استشارتك');

    fireEvent.press(screen.getByLabelText('تعليم الكل كمقروء'));
    await waitFor(() => expect(markAll).toHaveBeenCalled());
    expect(await screen.findByText('تم تعليم 3 إشعار كمقروء')).toBeOnTheScreen();
  });

  it('renders an error state with retry', async () => {
    const list = jest
      .spyOn(notificationsApi, 'list')
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(page([notif()]));

    renderWithProviders(<NotificationsScreen />);
    const retry = await screen.findByText('إعادة المحاولة');
    fireEvent.press(retry);
    expect(await screen.findByText('رد جديد على استشارتك')).toBeOnTheScreen();
    expect(list).toHaveBeenCalledTimes(2);
  });
});
