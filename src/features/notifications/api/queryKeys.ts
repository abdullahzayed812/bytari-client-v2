import type { NotificationListFilter } from '../types';

/**
 * Notification query keys (§35). One list cache per filter set (All / Unread /
 * per-type never overwrite each other); `unreadCount` and `preferences` are
 * separate lightweight entries.
 *
 *   notificationKeys.list(filter)   → ['notifications', 'list', { …filter }]
 *   notificationKeys.unreadCount()  → ['notifications', 'unread-count']
 *   notificationKeys.detail(id)     → ['notifications', 'detail', id]
 *   notificationKeys.preferences()  → ['notifications', 'preferences']
 *   notificationKeys.devices()      → ['notifications', 'devices']
 *   notificationKeys.petUnseen(id)  → ['notifications', 'pet-unseen', id]
 */
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filter: Omit<NotificationListFilter, 'page'>) =>
    [...notificationKeys.lists(), filter] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  detail: (notificationId: string) => [...notificationKeys.all, 'detail', notificationId] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
  devices: () => [...notificationKeys.all, 'devices'] as const,
  petUnseenAll: () => [...notificationKeys.all, 'pet-unseen'] as const,
  petUnseen: (animalId: string) => [...notificationKeys.petUnseenAll(), animalId] as const,
};
