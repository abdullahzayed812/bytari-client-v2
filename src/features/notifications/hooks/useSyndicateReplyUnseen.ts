import { useQuery } from '@tanstack/react-query';

import { notificationKeys, notificationsApi } from '../api';
import type { SyndicateReplyUnseenCounts } from '../types';

const NONE: SyndicateReplyUnseenCounts = { inquiries: 0, requests: 0, total: 0 };

/**
 * "طلباتي واستفساراتي" badge — the caller's OWN unread syndicate replies to
 * their submissions, per kind. Refreshed by the notification realtime events
 * + the per-submission mark-seen in the syndicates feature.
 */
export function useSyndicateReplyUnseenCounts(enabled = true): SyndicateReplyUnseenCounts {
  const q = useQuery({
    queryKey: notificationKeys.syndicateRepliesUnseen(),
    queryFn: () => notificationsApi.syndicateRepliesUnseen(),
    enabled,
  });
  return q.data ?? NONE;
}
