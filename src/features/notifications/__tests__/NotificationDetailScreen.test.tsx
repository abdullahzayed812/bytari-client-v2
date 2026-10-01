import { ApiError } from '@/services/api';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { notificationsApi } from '../api';
import NotificationDetailScreen from '../screens/NotificationDetailScreen';
import type { AppNotification } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const notif = (over: Partial<AppNotification> = {}): AppNotification => ({
  id: 'n1',
  type: 'ORGANIZATION_BROADCAST',
  title: 'اجتماع الهيئة العامة',
  body: 'يعقد الاجتماع يوم الخميس.',
  data: { organizationId: 'org-1', audience: 'SYNDICATE_MEMBERS' },
  actorUserId: 'u-2',
  entityType: 'ORGANIZATION',
  entityId: 'org-1',
  read: false,
  readAt: null,
  createdAt: '2026-09-30T09:00:00.000Z',
  source: {
    kind: 'ORGANIZATION',
    organizationId: 'org-1',
    organizationType: 'SYNDICATE',
    name: 'نقابة البصرة',
  },
  ...over,
});

beforeEach(() => {
  resetRouterMock();
  setSearchParams({ notificationId: 'n1' });
  jest.spyOn(notificationsApi, 'unreadCount').mockResolvedValue(1);
});
afterEach(() => jest.restoreAllMocks());

describe('NotificationDetailScreen', () => {
  it('shows sender, title, message and date; marks an unread one read on the server', async () => {
    const get = jest.spyOn(notificationsApi, 'get').mockResolvedValue(notif());
    const markRead = jest
      .spyOn(notificationsApi, 'markRead')
      .mockResolvedValue(notif({ read: true }));

    renderWithProviders(<NotificationDetailScreen />);

    expect(await screen.findByText('نقابة البصرة')).toBeOnTheScreen();
    expect(screen.getByText('اجتماع الهيئة العامة')).toBeOnTheScreen();
    expect(screen.getByText('يعقد الاجتماع يوم الخميس.')).toBeOnTheScreen();
    expect(screen.getByText('2026-9-30')).toBeOnTheScreen();
    expect(get).toHaveBeenCalledWith('n1');
    await waitFor(() => expect(markRead).toHaveBeenCalledWith('n1'));

    // Related content (the syndicate) is one tap away.
    fireEvent.press(screen.getByRole('button', { name: 'عرض المحتوى المرتبط' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/syndicates/org-1');
  });

  it('does not re-mark an already-read notification; admin sender is labelled', async () => {
    jest.spyOn(notificationsApi, 'get').mockResolvedValue(
      notif({
        type: 'ADMIN_ANNOUNCEMENT',
        read: true,
        readAt: '2026-09-30T10:00:00.000Z',
        data: {},
        entityType: null,
        entityId: null,
        source: { kind: 'ADMIN' },
      }),
    );
    const markRead = jest.spyOn(notificationsApi, 'markRead');

    renderWithProviders(<NotificationDetailScreen />);
    expect(await screen.findByText('إدارة بيطري')).toBeOnTheScreen();
    expect(markRead).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'عرض المحتوى المرتبط' })).toBeNull();
  });

  it("someone else's / a deleted notification (404) shows the unavailable state", async () => {
    jest
      .spyOn(notificationsApi, 'get')
      .mockRejectedValue(new ApiError({ code: 'NOT_FOUND', message: 'x', status: 404 }));
    renderWithProviders(<NotificationDetailScreen />);
    expect(await screen.findByText('الإشعار غير متاح')).toBeOnTheScreen();
  });
});
