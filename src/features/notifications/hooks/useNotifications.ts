import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { useAuth } from '@/hooks';
import { ApiError } from '@/services/api';

import { notificationKeys, notificationsApi } from '../api';
import type { AppNotification, NotificationType, Paginated } from '../types';

export interface UseNotificationsParams {
  /** `true` = read only, `false` = unread only, omitted = all. */
  read?: boolean;
  type?: NotificationType;
  pageSize?: number;
  enabled?: boolean;
}

/**
 * The caller's own notifications, newest-first, paginated (`page`/`pageSize`)
 * with the backend's `read` / `type` filters (§18/§24). The filter set is part
 * of the key so All / Unread never share a cache entry.
 */
export function useNotifications(params: UseNotificationsParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = { read: params.read, type: params.type, pageSize };

  const query = useInfiniteQuery<
    Paginated<AppNotification>,
    unknown,
    InfiniteData<Paginated<AppNotification>>,
    ReturnType<typeof notificationKeys.list>,
    number
  >({
    queryKey: notificationKeys.list(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      notificationsApi.list({ page: pageParam, pageSize, read: params.read, type: params.type }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });

  const items = useMemo<AppNotification[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;
  return { ...query, items, total };
}

/**
 * The unread badge count (`GET /notifications/unread-count` — a lightweight
 * `{ count }`, never the list, §19/§28). Only runs while authenticated; polling
 * is disabled — realtime `notification.created` invalidates it (§29).
 */
export function useUnreadCount(options: { enabled?: boolean } = {}) {
  const { isAuthenticated } = useAuth();
  return useQuery<number, ApiError>({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsApi.unreadCount(),
    enabled: isAuthenticated && (options.enabled ?? true),
    staleTime: 30_000,
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 401 || error.status === 403)) && count < 2,
  });
}
