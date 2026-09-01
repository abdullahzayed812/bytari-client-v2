import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { notificationKeys, notificationsApi } from '../api';
import type { AppNotification } from '../types';

/**
 * Read-state mutations. No optimistic writes — mutate → server success →
 * invalidate the list caches + the unread count (§36). Marking an
 * already-read notification is a backend no-op, never an error (§20).
 */
export function useMarkNotificationRead(): UseMutationResult<AppNotification, unknown, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['notifications', 'mark-read'],
    mutationFn: (notificationId: string) => notificationsApi.markRead(notificationId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.lists() });
      void qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

export function useMarkAllNotificationsRead(): UseMutationResult<
  { updated: number },
  unknown,
  void
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['notifications', 'mark-all-read'],
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.lists() });
      void qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}
