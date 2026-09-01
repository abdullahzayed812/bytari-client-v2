import { apiClient } from '@/services/api';

import { notificationKeys } from '../api/queryKeys';
import { notificationsApi } from '../api/notificationsApi';
import { notificationHref, notificationMeta } from '../constants';
import type { AppNotification } from '../types';

describe('notificationsApi — request shape', () => {
  const get = jest.spyOn(apiClient, 'get');
  const post = jest.spyOn(apiClient, 'post');
  const envelope = jest.spyOn(apiClient, 'requestEnvelope');

  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    envelope.mockReset();
    envelope.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
  });
  afterAll(() => jest.restoreAllMocks());

  it('list forwards page/pageSize and stringifies the read filter only when set', async () => {
    await notificationsApi.list({ page: 2, pageSize: 20 });
    expect(envelope).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/notifications',
        params: { page: 2, pageSize: 20, read: undefined, type: undefined },
      }),
    );

    await notificationsApi.list({ page: 1, pageSize: 20, read: false });
    expect(envelope).toHaveBeenLastCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ read: 'false' }) }),
    );

    await notificationsApi.list({
      page: 1,
      pageSize: 20,
      read: true,
      type: 'ORGANIZATION_APPROVED',
    });
    expect(envelope).toHaveBeenLastCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ read: 'true', type: 'ORGANIZATION_APPROVED' }),
      }),
    );
  });

  it('maps the DTO, defaulting nullable fields and keeping an unknown type visible', async () => {
    envelope.mockResolvedValueOnce({
      data: [
        {
          id: 'n1',
          type: 'CONSULTATION_MESSAGE_RECEIVED',
          title: 'New reply',
          body: 'x',
          data: { consultationId: 'c1' },
          entityType: 'CONSULTATION',
          entityId: 'c1',
          read: false,
          createdAt: '2026-08-28',
        },
        { id: 'n2', type: 'SOMETHING_NEW', title: 'y', body: 'z', createdAt: '2026-08-28' },
      ],
      meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });
    const page = await notificationsApi.list({ page: 1, pageSize: 20 });
    expect(page.items[0]).toMatchObject({
      id: 'n1',
      entityType: 'CONSULTATION',
      read: false,
      actorUserId: null,
      readAt: null,
    });
    expect(page.items[1]).toMatchObject({ id: 'n2', type: 'ADMIN_ANNOUNCEMENT', data: {} });
  });

  it('unreadCount / markRead / markAllRead hit the right endpoints', async () => {
    get.mockResolvedValueOnce({ count: 7 });
    expect(await notificationsApi.unreadCount()).toBe(7);
    expect(get).toHaveBeenCalledWith('/notifications/unread-count');

    post.mockResolvedValueOnce({ id: 'n1', type: 'ADMIN_ANNOUNCEMENT', read: true, createdAt: '' });
    await notificationsApi.markRead('n1');
    expect(post).toHaveBeenCalledWith('/notifications/n1/read', {});

    post.mockResolvedValueOnce({ updated: 4 });
    expect(await notificationsApi.markAllRead()).toEqual({ updated: 4 });
    expect(post).toHaveBeenLastCalledWith('/notifications/read-all', {});
  });
});

describe('notificationKeys', () => {
  it('scopes lists by filter and keeps count / preferences separate', () => {
    expect(notificationKeys.list({ pageSize: 20 })).toEqual([
      'notifications',
      'list',
      { pageSize: 20 },
    ]);
    expect(notificationKeys.list({ pageSize: 20, read: false })).not.toEqual(
      notificationKeys.list({ pageSize: 20 }),
    );
    expect(notificationKeys.unreadCount()).toEqual(['notifications', 'unread-count']);
    expect(notificationKeys.preferences()).toEqual(['notifications', 'preferences']);
  });
});

describe('notificationHref — deep-link resolution', () => {
  const n = (over: Partial<AppNotification>): Parameters<typeof notificationHref>[0] => ({
    type: 'ADMIN_ANNOUNCEMENT',
    entityType: null,
    entityId: null,
    data: {},
    ...over,
  });

  it('routes to the entity that actually has a screen in this build', () => {
    expect(notificationHref(n({ entityType: 'CONSULTATION', entityId: 'c1' }))).toBe(
      '/(app)/support/consultations/c1',
    );
    expect(notificationHref(n({ entityType: 'INQUIRY', entityId: 'i1' }))).toBe(
      '/(app)/support/inquiries/i1',
    );
    expect(notificationHref(n({ entityType: 'ORGANIZATION', entityId: 'o1' }))).toBe(
      '/(app)/organizations/o1',
    );
    expect(notificationHref(n({ entityType: 'VETERINARIAN', entityId: 'u1' }))).toBe(
      '/(app)/veterinarian',
    );
    expect(notificationHref(n({ type: 'ACCOUNT_STATUS_CHANGED' }))).toBe('/(app)/(tabs)/account');
  });

  it('falls back to entityId in data, then the list route', () => {
    expect(
      notificationHref(n({ entityType: 'CONSULTATION', data: { consultationId: 'c9' } })),
    ).toBe('/(app)/support/consultations/c9');
    expect(notificationHref(n({ entityType: 'CONSULTATION' }))).toBe(
      '/(app)/support/consultations',
    );
  });

  it('resolves an FCM push payload (type + data only, no entityType column)', () => {
    expect(
      notificationHref(
        n({
          type: 'CONSULTATION_MESSAGE_RECEIVED',
          data: { type: 'CONSULTATION_MESSAGE_RECEIVED', consultationId: 'c1', messageId: 'm1' },
        }),
      ),
    ).toBe('/(app)/support/consultations/c1');
    expect(
      notificationHref(n({ type: 'ORGANIZATION_APPROVED', data: { organizationId: 'o5' } })),
    ).toBe('/(app)/organizations/o5');
    expect(notificationHref(n({ type: 'VETERINARIAN_APPROVED' }))).toBe('/(app)/veterinarian');
  });

  it('routes a chat message notification to the conversation thread', () => {
    expect(
      notificationHref(
        n({ type: 'CHAT_MESSAGE_RECEIVED', entityType: 'CONVERSATION', entityId: 'x' }),
      ),
    ).toBe('/(app)/chat/x');
  });

  it('returns null when there is genuinely no screen for it', () => {
    expect(notificationHref(n({ type: 'CONTENT_PUBLISHED' }))).toBeNull();
  });

  it('every notification type has presentation metadata', () => {
    expect(notificationMeta('ORGANIZATION_APPROVED').tone).toBe('success');
    expect(notificationMeta('TOTALLY_UNKNOWN').icon).toBe('notifications-outline');
  });
});
