import type { NotificationListFilter } from '../types';

/**
 * Notification query keys (§35). One list cache per filter set (All / Unread /
 * per-type never overwrite each other); `unreadCount` and `preferences` are
 * separate lightweight entries.
 *
 *   notificationKeys.list(filter)   → ['notifications', 'list', { …filter }]
 *   notificationKeys.unreadCount()  → ['notifications', 'unread-count']
 *   notificationKeys.preferences()  → ['notifications', 'preferences']
 *   notificationKeys.devices()      → ['notifications', 'devices']
 */
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filter: Omit<NotificationListFilter, 'page'>) =>
    [...notificationKeys.lists(), filter] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
  devices: () => [...notificationKeys.all, 'devices'] as const,
};
