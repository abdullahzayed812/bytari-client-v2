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

/**
 * Unread badge counts — every conversation the caller can see, or one
 * organization's (clinic / office dashboard). Org-side counts are per member.
 */
export function useConversationUnreadSummary(
  organizationId?: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: chatKeys.unreadSummary(organizationId),
    queryFn: () => chatApi.getUnreadSummary(organizationId),
    enabled: options.enabled ?? true,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
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

/**
 * A conversation's messages in CHRONOLOGICAL order (oldest → newest), so
 * `messages[messages.length - 1]` is the newest — what the thread screens mark
 * read and scroll to.
 *
 * The server pages NEWEST-first (`GET /conversations/:id/messages`, page 1 =
 * the latest messages, each page `created_at DESC`), so the loaded pages are
 * flattened and reversed here (`newestFirst` keeps the server order for an
 * `inverted` list). Treating the raw order as chronological marked the OLDEST
 * loaded message read, which left the unread counter stuck.
 */
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

  /** Server order, newest → oldest — what an `inverted` thread list renders. */
  const newestFirst = useMemo<ChatMessage[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const messages = useMemo<ChatMessage[]>(() => [...newestFirst].reverse(), [newestFirst]);
  const total = query.data?.pages[0]?.meta.total ?? 0;
  return { ...query, messages, newestFirst, total };
}
