import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { globalChatApi, globalChatKeys } from '../api';
import type { ChatRoomDetail, ChatRoomSummary, Paginated } from '../types';

/** Public room browse — ACTIVE rooms, any authenticated user (`GET /chat-rooms`). */
export function useChatRooms(
  params: { search?: string; pageSize?: number; enabled?: boolean } = {},
) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = { search: params.search, pageSize };

  const query = useInfiniteQuery<
    Paginated<ChatRoomSummary>,
    unknown,
    InfiniteData<Paginated<ChatRoomSummary>>,
    ReturnType<typeof globalChatKeys.list>,
    number
  >({
    queryKey: globalChatKeys.list(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      globalChatApi.list({ page: pageParam, pageSize, search: params.search }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });

  const rooms = useMemo<ChatRoomSummary[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;
  const unreadTotal = useMemo(
    () => rooms.reduce((sum, r) => sum + r.unreadCount, 0),
    [rooms],
  );
  return { ...query, rooms, total, unreadTotal };
}

/** One room's full detail (rules, membership, pinned message). A non-ACTIVE / unknown id → 404. */
export function useChatRoom(organizationId: string | undefined, options: { enabled?: boolean } = {}) {
  return useQuery<ChatRoomDetail, ApiError>({
    queryKey: globalChatKeys.detail(organizationId ?? 'unknown'),
    queryFn: () => globalChatApi.get(organizationId as string),
    enabled: Boolean(organizationId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}
