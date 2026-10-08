import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import { isNotificationType } from '../types';
import type {
  AppNotification,
  NotificationListFilter,
  NotificationPreferences,
  Paginated,
  NotificationSource,
  PetCareSection,
  PetUnseenCounts,
  RegisteredDevice,
} from '../types';

function readMeta(meta: unknown, page: number, pageSize: number, count: number): ApiPageMeta {
  const m = (meta ?? {}) as Partial<ApiPageMeta>;
  return {
    page: m.page ?? page,
    pageSize: m.pageSize ?? pageSize,
    total: m.total ?? count,
    totalPages: m.totalPages ?? 1,
  };
}

function toSource(raw: unknown): NotificationSource {
  const s = (raw ?? {}) as Record<string, unknown>;
  const name = typeof s.name === 'string' ? s.name : '';
  if (s.kind === 'ADMIN') return { kind: 'ADMIN' };
  if (s.kind === 'ORGANIZATION' && name && typeof s.organizationId === 'string') {
    return {
      kind: 'ORGANIZATION',
      organizationId: s.organizationId,
      organizationType: String(s.organizationType ?? ''),
      name,
    };
  }
  if (s.kind === 'USER' && name && typeof s.userId === 'string') {
    return { kind: 'USER', userId: s.userId, name };
  }
  return { kind: 'SYSTEM' };
}

/** Backend `NotificationDTO` → the app model. Unknown types are kept but flagged. */
function toNotification(raw: unknown): AppNotification {
  const r = (raw ?? {}) as Record<string, unknown>;
  const type = isNotificationType(r.type) ? r.type : 'ADMIN_ANNOUNCEMENT';
  return {
    id: String(r.id ?? ''),
    type,
    title: String(r.title ?? ''),
    body: String(r.body ?? ''),
    data: (r.data as Record<string, unknown> | undefined) ?? {},
    actorUserId: (r.actorUserId as string | null) ?? null,
    entityType: (r.entityType as string | null) ?? null,
    entityId: (r.entityId as string | null) ?? null,
    read: Boolean(r.read),
    readAt: (r.readAt as string | null) ?? null,
    createdAt: String(r.createdAt ?? ''),
    source: toSource(r.source),
  };
}

/**
 * Notification wrappers — 1:1 with `server/src/modules/notifications`. Every
 * route is authentication + ownership only; the repository scopes every query
 * to `recipient_user_id`, so another user's id is a 404, never a foreign row.
 *
 *   GET   /notifications?page&pageSize&read&type
 *   GET   /notifications/unread-count
 *   GET   /notifications/:id                (own rows only — another id is 404)
 *   POST  /notifications/:id/read           (idempotent)
 *   POST  /notifications/read-all
 *   GET   /notifications/pets/:animalId/unseen   (own unread pet-care notifications per section)
 *   POST  /notifications/pets/:animalId/seen     { section } — clears ONE section
 *   GET   /notifications/preferences
 *   PATCH /notifications/preferences         { pushEnabled }
 *   POST  /notifications/devices             { token, platform, deviceId?, appVersion? }
 *   GET   /notifications/devices
 *   DELETE /notifications/devices/:deviceId
 */
export const notificationsApi = {
  async list(filter: NotificationListFilter): Promise<Paginated<AppNotification>> {
    const envelope = await apiClient.requestEnvelope<unknown[]>({
      method: 'GET',
      url: '/notifications',
      params: {
        page: filter.page,
        pageSize: filter.pageSize,
        read: filter.read === undefined ? undefined : String(filter.read),
        type: filter.type,
      },
    });
    const items = (envelope.data ?? []).map(toNotification);
    return { items, meta: readMeta(envelope.meta, filter.page, filter.pageSize, items.length) };
  },

  async unreadCount(): Promise<number> {
    const res = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return Number(res?.count ?? 0);
  },

  async get(notificationId: string): Promise<AppNotification> {
    return toNotification(await apiClient.get<unknown>(`/notifications/${notificationId}`));
  },

  async markRead(notificationId: string): Promise<AppNotification> {
    return toNotification(
      await apiClient.post<unknown>(`/notifications/${notificationId}/read`, {}),
    );
  },

  async markAllRead(): Promise<{ updated: number }> {
    const res = await apiClient.post<{ updated: number }>('/notifications/read-all', {});
    return { updated: Number(res?.updated ?? 0) };
  },

  async petUnseen(animalId: string): Promise<PetUnseenCounts> {
    const res = await apiClient.get<Partial<PetUnseenCounts>>(
      `/notifications/pets/${animalId}/unseen`,
    );
    return {
      vaccinations: Number(res?.vaccinations ?? 0),
      reminders: Number(res?.reminders ?? 0),
    };
  },

  async markPetSectionSeen(
    animalId: string,
    section: PetCareSection,
  ): Promise<{ updated: number }> {
    const res = await apiClient.post<{ updated: number }>(`/notifications/pets/${animalId}/seen`, {
      section,
    });
    return { updated: Number(res?.updated ?? 0) };
  },

  getPreferences(): Promise<NotificationPreferences> {
    return apiClient.get<NotificationPreferences>('/notifications/preferences');
  },

  updatePreferences(pushEnabled: boolean): Promise<NotificationPreferences> {
    return apiClient.patch<NotificationPreferences>('/notifications/preferences', { pushEnabled });
  },

  listDevices(): Promise<RegisteredDevice[]> {
    return apiClient.get<RegisteredDevice[]>('/notifications/devices').then((rows) => rows ?? []);
  },
};

export type NotificationsApi = typeof notificationsApi;
