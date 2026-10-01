import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
} from '@tanstack/react-query';

import { chatApi, chatKeys } from '../api';
import type { ChatMessage, Conversation, StartConversationInput, SendMessageInput } from '../types';

/**
 * Chat mutations. No optimistic message insert — the realtime
 * `chat.message.created` event + the POST response both invalidate the same
 * `chatKeys.messages(id)` query, and a single REST refetch is the source of
 * truth, so a message can never appear twice (§21).
 */
export function useSendMessage(
  conversationId: string,
): UseMutationResult<ChatMessage, unknown, string | SendMessageInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['chat', 'send', conversationId],
    mutationFn: (input: string | SendMessageInput) => chatApi.sendMessage(conversationId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.messages(conversationId) });
      void qc.invalidateQueries({ queryKey: chatKeys.detail(conversationId) });
      void qc.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });
}

/**
 * Persists the read marker (`POST /conversations/:id/read`), then refetches
 * every list whose unread badge derives from it. `alsoInvalidate` lets a
 * caller add its own list (e.g. the global chat-room list) so its counter
 * reflects the server state too.
 */
export function useMarkConversationRead(
  conversationId: string,
  options: { alsoInvalidate?: readonly QueryKey[] } = {},
): UseMutationResult<void, unknown, string> {
  const qc = useQueryClient();
  const { alsoInvalidate } = options;
  return useMutation({
    mutationKey: ['chat', 'read', conversationId],
    mutationFn: (messageId: string) => chatApi.markRead(conversationId, messageId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.detail(conversationId) });
      void qc.invalidateQueries({ queryKey: chatKeys.lists() });
      for (const queryKey of alsoInvalidate ?? []) void qc.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteMessage(
  conversationId: string,
): UseMutationResult<ChatMessage, unknown, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['chat', 'delete-message', conversationId],
    mutationFn: (messageId: string) => chatApi.deleteMessage(messageId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.messages(conversationId) });
    },
  });
}

/** "إيقاف المحادثة" — close a marketplace deal conversation. */
export function useCloseConversation(
  conversationId: string,
): UseMutationResult<Conversation, unknown, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['chat', 'close', conversationId],
    mutationFn: () => chatApi.close(conversationId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.detail(conversationId) });
      void qc.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });
}

/** Start (or fetch the existing) conversation, then invalidate the list. */
export function useStartConversation(): UseMutationResult<
  Conversation,
  unknown,
  StartConversationInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['chat', 'start'],
    mutationFn: (input: StartConversationInput) => chatApi.start(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });
}
