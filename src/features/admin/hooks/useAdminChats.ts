import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { adminApi, adminKeys } from '../api';
import type { AdminChatConversation, Paginated } from '../types';

export interface AdminChatsParams {
  pageSize?: number;
  enabled?: boolean;
}

/** `/admin/chat/conversations` — read-only oversight list (`chat.read`, ADMIN-override). */
export function useAdminChats(params: AdminChatsParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;

  const query = useInfiniteQuery<
    Paginated<AdminChatConversation>,
    ApiError,
    InfiniteData<Paginated<AdminChatConversation>>,
    ReturnType<typeof adminKeys.chats.lists>,
    number
  >({
    queryKey: adminKeys.chats.lists(),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => adminApi.listChatConversations({ page: pageParam, pageSize }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });

  const conversations = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  return { ...query, conversations, total: query.data?.pages[0]?.meta.total ?? 0 };
}
