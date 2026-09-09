import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { chatApi, chatKeys } from '../api';
import type { ChatMessage, Conversation, StartConversationInput } from '../types';

/**
 * Chat mutations. No optimistic message insert — the realtime
 * `chat.message.created` event + the POST response both invalidate the same
 * `chatKeys.messages(id)` query, and a single REST refetch is the source of
 * truth, so a message can never appear twice (§21).
 */
export function useSendMessage(
  conversationId: string,
): UseMutationResult<ChatMessage, unknown, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['chat', 'send', conversationId],
    mutationFn: (body: string) => chatApi.sendMessage(conversationId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.messages(conversationId) });
      void qc.invalidateQueries({ queryKey: chatKeys.detail(conversationId) });
      void qc.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });
}

export function useMarkConversationRead(
  conversationId: string,
): UseMutationResult<void, unknown, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['chat', 'read', conversationId],
    mutationFn: (messageId: string) => chatApi.markRead(conversationId, messageId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.detail(conversationId) });
      void qc.invalidateQueries({ queryKey: chatKeys.lists() });
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
