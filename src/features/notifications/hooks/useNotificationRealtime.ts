import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/hooks';
import { realtimeClient } from '@/services/realtime';

import { notificationKeys } from '../api';

/**
 * Live notification updates through the **existing** realtime transport
 * (`src/services/realtime`, connected by `RealtimeGate`). Every authenticated
 * socket is auto-joined to its own `user:<id>` room server-side, so no explicit
 * room subscription is needed — `notification.created` / `notification.read`
 * (ids-only payloads) simply arrive.
 *
 * On either event it invalidates the notification lists + the unread count so
 * the REST hooks refetch (§29). No new websocket code. If the socket is down,
 * pull-to-refresh and the 30s `staleTime` keep the inbox fresh enough.
 *
 * Mounted once, app-wide, by `NotificationsGate`.
 */
export function useNotificationRealtime(): void {
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const refresh = (): void => {
      void qc.invalidateQueries({ queryKey: notificationKeys.lists() });
      void qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    };

    const subs = [
      realtimeClient.on('notification.created', refresh),
      realtimeClient.on('notification.read', refresh),
    ];
    return () => subs.forEach((s) => s.unsubscribe());
  }, [isAuthenticated, qc]);
}
