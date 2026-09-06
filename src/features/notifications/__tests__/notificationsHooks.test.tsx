import { waitFor } from '@testing-library/react-native';

import { useAuthStore } from '@/features/auth/store';
import { makeTestQueryClient, renderHookWithQuery } from '@/test-utils/render';

import { notificationsApi } from '../api/notificationsApi';
import { notificationKeys } from '../api/queryKeys';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationRealtime,
  useNotifications,
  useUnreadCount,
} from '../hooks';
import type { AppNotification, Paginated } from '../types';

const realtimeHandlers: Record<string, () => void> = {};
jest.mock('@/services/realtime', () => ({
  realtimeClient: {
    on: (type: string, fn: () => void) => {
      realtimeHandlers[type] = fn;
      return { unsubscribe: jest.fn() };
    },
  },
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
  type: 'ADMIN_ANNOUNCEMENT',
  title: 't',
  body: 'b',
  data: {},
  actorUserId: null,
  entityType: null,
  entityId: null,
  read: false,
  readAt: null,
  createdAt: '2026-08-28',
  ...over,
});

const page = (items: AppNotification[], totalPages = 1): Paginated<AppNotification> => ({
  items,
  meta: { page: 1, pageSize: 20, total: items.length, totalPages },
});

beforeEach(() => authed());
afterEach(() => jest.restoreAllMocks());
afterAll(() => useAuthStore.setState({ session: null, user: null, status: 'unauthenticated' }));

describe('useNotifications', () => {
  it('flattens pages newest-first and exposes the reported total', async () => {
    jest.spyOn(notificationsApi, 'list').mockResolvedValueOnce({
      ...page([notif({ id: 'a' })], 2),
      meta: { page: 1, pageSize: 20, total: 5, totalPages: 2 },
    });
    const { result } = renderHookWithQuery(() => useNotifications(), {
      client: makeTestQueryClient(),
    });
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.total).toBe(5);
    expect(result.current.hasNextPage).toBe(true);
  });

  it('passes the unread filter through', async () => {
    const spy = jest.spyOn(notificationsApi, 'list').mockResolvedValue(page([]));
    renderHookWithQuery(() => useNotifications({ read: false }), { client: makeTestQueryClient() });
    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ read: false }));
  });
});

describe('useUnreadCount', () => {
  it('reads the lightweight count endpoint while authenticated', async () => {
    jest.spyOn(notificationsApi, 'unreadCount').mockResolvedValueOnce(3);
    const { result } = renderHookWithQuery(() => useUnreadCount(), {
      client: makeTestQueryClient(),
    });
    await waitFor(() => expect(result.current.data).toBe(3));
  });

  it('does not run when unauthenticated', async () => {
    useAuthStore.setState({ status: 'unauthenticated', session: null, user: null });
    const spy = jest.spyOn(notificationsApi, 'unreadCount').mockResolvedValue(9);
    const { result } = renderHookWithQuery(() => useUnreadCount(), {
      client: makeTestQueryClient(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('read-state mutations', () => {
  it('useMarkNotificationRead invalidates the lists + the unread count', async () => {
    jest.spyOn(notificationsApi, 'markRead').mockResolvedValueOnce(notif({ read: true }));
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useMarkNotificationRead(), { client });

    await result.current.mutateAsync('n1');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: notificationKeys.lists() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: notificationKeys.unreadCount() });
  });

  it('useMarkAllNotificationsRead invalidates the lists + the unread count', async () => {
    jest.spyOn(notificationsApi, 'markAllRead').mockResolvedValueOnce({ updated: 2 });
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useMarkAllNotificationsRead(), { client });

    await result.current.mutateAsync();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: notificationKeys.lists() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: notificationKeys.unreadCount() });
  });
});

describe('useNotificationRealtime', () => {
  it('invalidates the lists + unread count on a notification.created event', async () => {
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    renderHookWithQuery(() => useNotificationRealtime(), { client });

    await waitFor(() => expect(realtimeHandlers['notification.created']).toBeDefined());
    realtimeHandlers['notification.created']!();

    expect(invalidate).toHaveBeenCalledWith({ queryKey: notificationKeys.lists() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: notificationKeys.unreadCount() });
    expect(realtimeHandlers['notification.read']).toBeDefined();
  });
});
