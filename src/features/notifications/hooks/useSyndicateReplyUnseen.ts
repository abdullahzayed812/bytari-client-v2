import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { notificationKeys, notificationsApi } from '../api';
import type { SyndicateReplyKind, SyndicateReplyUnseenCounts } from '../types';

const NONE: SyndicateReplyUnseenCounts = { inquiries: 0, requests: 0, total: 0 };

/**
 * "طلباتي واستفساراتي" badge — the caller's OWN unread syndicate replies to
 * their submissions, per kind. Refreshed by the notification realtime events
 * + `useMarkSyndicateRepliesSeen`.
 */
export function useSyndicateReplyUnseenCounts(enabled = true): SyndicateReplyUnseenCounts {
  const q = useQuery({
    queryKey: notificationKeys.syndicateRepliesUnseen(),
    queryFn: () => notificationsApi.syndicateRepliesUnseen(),
    enabled,
  });
  return q.data ?? NONE;
}

/**
 * Viewing one tab of "طلباتي واستفساراتي" marks that kind's replies read —
 * again whenever a new reply arrives while the tab is open — then refreshes
 * the badge, the inbox, the unread count and the submission list (so the new
 * reply text shows).
 */
export function useMarkSyndicateRepliesSeen(
  kind: SyndicateReplyKind,
  unseen: number,
  onSeen?: () => void,
): void {
  const qc = useQueryClient();
  const { mutate } = useMutation({
    mutationKey: ['notifications', 'syndicate-replies-seen'],
    mutationFn: (k: SyndicateReplyKind) => notificationsApi.markSyndicateRepliesSeen(k),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: notificationKeys.syndicateRepliesUnseen() });
      if (res.updated > 0) {
        void qc.invalidateQueries({ queryKey: notificationKeys.lists() });
        void qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
        onSeen?.();
      }
    },
  });
  useEffect(() => {
    if (unseen > 0) mutate(kind);
  }, [kind, unseen, mutate]);
}
