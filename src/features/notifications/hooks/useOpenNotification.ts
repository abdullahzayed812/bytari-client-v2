import { router } from 'expo-router';
import { useCallback } from 'react';

import { notificationDestination } from '../constants';
import type { AppNotification } from '../types';

import { useMarkNotificationRead } from './useNotificationMutations';

/**
 * The single "open this notification" action used by the inbox card. It marks
 * the row read on the server (`POST /notifications/:id/read`, which then
 * refetches the lists + the unread badge — the counter is never decremented
 * locally) and navigates per `notificationDestination`: the related entity,
 * or the notification's details screen for a message (admin / organization
 * broadcast) or a type without a destination. The destination screen
 * re-authorises its own data fetch, so an unauthorised deep link just lands
 * on that screen's error state (§27).
 */
export function useOpenNotification(): (n: AppNotification) => void {
  const markRead = useMarkNotificationRead();

  return useCallback(
    (n: AppNotification) => {
      if (!n.read) markRead.mutate(n.id);
      router.push(notificationDestination(n) as never);
    },
    [markRead],
  );
}
