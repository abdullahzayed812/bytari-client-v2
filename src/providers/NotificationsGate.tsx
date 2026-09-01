import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

import { Routes } from '@/constants/routes';
import { onBeforeLogout } from '@/features/auth/store/authStore';
import { useChatListRealtime } from '@/features/chat/hooks';
import { notificationHref } from '@/features/notifications/constants';
import { useNotificationRealtime, useUnreadCount } from '@/features/notifications/hooks';
import type { AppNotification } from '@/features/notifications/types';
import { useAuth } from '@/hooks';
import { createLogger } from '@/lib/logger';
import { notificationService } from '@/services/notifications';
import type { ReceivedNotification } from '@/services/notifications';

const log = createLogger('notifications-gate');

/**
 * App-wide notifications wiring. Renders nothing.
 *
 *  - Device lifecycle (§31/§33): on an authenticated session, soft-request push
 *    permission, obtain the native FCM token and register it with the backend;
 *    register a pre-logout task that unregisters this device's row. Permission
 *    denial / simulator / Expo Go never block anything — the inbox still works.
 *  - Realtime: `useNotificationRealtime()` invalidates the notification queries
 *    on `notification.created` / `notification.read`; `useChatListRealtime()`
 *    refreshes the conversation list on `chat.conversation.created`.
 *  - OS badge (§28): mirrors the unread count onto the app icon.
 *  - Push taps (§30): foreground/background taps and a cold-start launch
 *    notification resolve to an in-app destination once navigation is ready.
 */
export function NotificationsGate() {
  const { isAuthenticated } = useAuth();
  const registeredDeviceId = useRef<string | null>(null);
  const coldStartHandled = useRef(false);

  useNotificationRealtime();
  useChatListRealtime();

  // --- OS badge mirrors the unread count ---
  const { data: unread = 0 } = useUnreadCount();
  useEffect(() => {
    void notificationService.setBadgeCount(unread);
  }, [unread]);

  // --- device registration + pre-logout unregister ---
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    void (async () => {
      try {
        const token = await notificationService.getDevicePushToken();
        if (!token || cancelled) return;
        const id = await notificationService.registerDevice(token);
        if (!cancelled) registeredDeviceId.current = id;
      } catch (error) {
        log.warn('device registration skipped', {
          reason: error instanceof Error ? error.message : 'unknown',
        });
      }
    })();

    const off = onBeforeLogout(async () => {
      const id = registeredDeviceId.current;
      registeredDeviceId.current = null;
      if (id) await notificationService.unregisterDevice(id);
    });

    return () => {
      cancelled = true;
      off();
    };
  }, [isAuthenticated]);

  // --- push taps → deep link ---
  useEffect(() => {
    const go = (n: ReceivedNotification): void => {
      const href = notificationHref({
        type: (n.data.type as AppNotification['type']) ?? 'ADMIN_ANNOUNCEMENT',
        entityType: (n.data.entityType as string | null) ?? null,
        entityId: (n.data.entityId as string | null) ?? null,
        data: n.data,
      });
      router.push((href ?? Routes.notifications) as never);
    };

    const sub = notificationService.onNotificationTap((n) => {
      if (isAuthenticated) go(n);
    });

    // Cold start: the app was launched by tapping a notification.
    if (isAuthenticated && !coldStartHandled.current) {
      coldStartHandled.current = true;
      void notificationService.getInitialNotification().then((n) => {
        if (n) setTimeout(() => go(n), 300); // let the navigator settle first
      });
    }

    return sub;
  }, [isAuthenticated]);

  return null;
}
