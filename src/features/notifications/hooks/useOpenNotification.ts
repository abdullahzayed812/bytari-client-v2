import { router } from 'expo-router';
import { useCallback } from 'react';

import { Routes } from '@/constants/routes';

import { notificationHref } from '../constants';
import type { AppNotification } from '../types';

import { useMarkNotificationRead } from './useNotificationMutations';

/**
 * The single "open this notification" action used by the inbox card and by a
 * push tap. It marks the row read (fire-and-forget — the backend is idempotent)
 * and navigates to the entity when a destination exists in this build; if none
 * does it stays on / opens the inbox. The destination screen re-authorises its
 * own data fetch, so an unauthorised deep link just lands on that screen's
 * error state (§27).
 */
export function useOpenNotification(): (n: AppNotification) => void {
  const markRead = useMarkNotificationRead();

  return useCallback(
    (n: AppNotification) => {
      if (!n.read) markRead.mutate(n.id);
      const href = notificationHref(n);
      if (href) router.push(href as never);
      else router.push(Routes.notifications);
    },
    [markRead],
  );
}
