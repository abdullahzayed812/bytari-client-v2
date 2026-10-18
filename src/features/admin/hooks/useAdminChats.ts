import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import type { ChatMessage } from '@/features/chat/types';
import { ApiError } from '@/services/api';

import { adminApi, adminKeys } from '../api';
import type { AdminChatConversation, AdminChatConversationDetail, Paginated } from '../types';

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

/** One conversation's oversight details (participants, organization). */
export function useAdminChatConversation(conversationId: string | undefined) {
  return useQuery<AdminChatConversationDetail, ApiError>({
    queryKey: adminKeys.chats.detail(conversationId ?? 'unknown'),
    queryFn: () => adminApi.getChatConversation(conversationId as string),
    enabled: Boolean(conversationId),
  });
}

/** Its messages, oldest first; `fetchNextPage` loads the newer ones. */
export function useAdminChatMessages(conversationId: string | undefined, pageSize = 30) {
  const query = useInfiniteQuery<
    Paginated<ChatMessage>,
    ApiError,
    InfiniteData<Paginated<ChatMessage>>,
    ReturnType<typeof adminKeys.chats.messages>,
    number
  >({
    queryKey: adminKeys.chats.messages(conversationId ?? 'unknown'),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      adminApi.listChatMessages(conversationId as string, pageParam, pageSize),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(conversationId),
  });
  const messages = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, messages, total: query.data?.pages[0]?.meta.total ?? 0 };
}
