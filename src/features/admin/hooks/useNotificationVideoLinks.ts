import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { adminApi, adminKeys } from '../api';
import type { NotificationVideoLink, NotificationVideoLinkKey } from '../types';

/** `GET /admin/notifications/video-links` — every key, with its link or `null`. */
export function useNotificationVideoLinks(): UseQueryResult<NotificationVideoLink[], unknown> {
  return useQuery({
    queryKey: adminKeys.notificationVideoLinks,
    queryFn: () => adminApi.listNotificationVideoLinks(),
  });
}

/** Set (`url` given) or remove (`url: null`) one key's video link. */
export function useSaveNotificationVideoLink(): UseMutationResult<
  unknown,
  unknown,
  { key: NotificationVideoLinkKey; url: string | null }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, url }): Promise<unknown> =>
      url ? adminApi.setNotificationVideoLink(key, url) : adminApi.removeNotificationVideoLink(key),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.notificationVideoLinks }),
  });
}
