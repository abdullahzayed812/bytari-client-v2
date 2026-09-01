import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { chatApi, chatKeys } from '../api';
import type { ChatMessage, Conversation, Paginated } from '../types';

export interface UseConversationsParams {
  /** Restrict to one organization's conversations (clinic / farm staff view). */
  organizationId?: string;
  pageSize?: number;
  enabled?: boolean;
}

/** The caller's conversations, newest-activity first, paginated (`GET /conversations`). */
export function useConversations(params: UseConversationsParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = { organizationId: params.organizationId, pageSize };

  const query = useInfiniteQuery<
    Paginated<Conversation>,
    unknown,
    InfiniteData<Paginated<Conversation>>,
    ReturnType<typeof chatKeys.list>,
    number
  >({
    queryKey: chatKeys.list(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      chatApi.listConversations({
        page: pageParam,
        pageSize,
        organizationId: params.organizationId,
      }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });

  const conversations = useMemo<Conversation[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;
  /** Sum of per-conversation unread (ignores `null`, the dynamic clinic side). */
  const unreadTotal = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0),
    [conversations],
  );
  return { ...query, conversations, total, unreadTotal };
}

/** One conversation. A non-participant id → 404 (no retry). */
export function useConversation(
  conversationId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<Conversation, ApiError>({
    queryKey: chatKeys.detail(conversationId ?? 'unknown'),
    queryFn: () => chatApi.getConversation(conversationId as string),
    enabled: Boolean(conversationId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}

/** A conversation's messages, oldest → newest, paginated. */
export function useMessages(
  conversationId: string | undefined,
  options: { pageSize?: number; enabled?: boolean } = {},
) {
  const pageSize = options.pageSize ?? 30;

  const query = useInfiniteQuery<
    Paginated<ChatMessage>,
    unknown,
    InfiniteData<Paginated<ChatMessage>>,
    ReturnType<typeof chatKeys.messages>,
    number
  >({
    queryKey: chatKeys.messages(conversationId ?? 'unknown'),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => chatApi.listMessages(conversationId as string, pageParam, pageSize),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(conversationId) && (options.enabled ?? true),
    staleTime: 10_000,
  });

  const messages = useMemo<ChatMessage[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;
  return { ...query, messages, total };
}
