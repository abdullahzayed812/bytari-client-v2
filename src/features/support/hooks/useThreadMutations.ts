import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { supportKeys, threadApi } from '../api';
import type {
  CreateConsultationInput,
  CreateInquiryInput,
  SendMessageInput,
  Thread,
  ThreadKind,
  ThreadMessage,
} from '../types';

/**
 * Consultation / Inquiry mutations. No optimistic updates (§29) — mutate →
 * server success → invalidate the narrowest prefix. The backend derives the
 * creator, the responder identity and the message `source`.
 */

export function useCreateThread(
  kind: ThreadKind,
): UseMutationResult<Thread, unknown, CreateConsultationInput | CreateInquiryInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['support', kind, 'create'],
    mutationFn: (input) => threadApi(kind).create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: supportKeys.myLists(kind) });
    },
  });
}

export function useSendMessage(
  kind: ThreadKind,
  threadId: string,
): UseMutationResult<ThreadMessage, unknown, SendMessageInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['support', kind, 'send', threadId],
    mutationFn: (input) => threadApi(kind).sendMessage(threadId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: supportKeys.messages(kind, threadId) });
      void qc.invalidateQueries({ queryKey: supportKeys.detail(kind, threadId) });
      void qc.invalidateQueries({ queryKey: supportKeys.myLists(kind) });
      void qc.invalidateQueries({ queryKey: supportKeys.adminLists(kind) });
    },
  });
}

export function useCloseThread(
  kind: ThreadKind,
  threadId: string,
): UseMutationResult<Thread, unknown, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['support', kind, 'close', threadId],
    mutationFn: () => threadApi(kind).close(threadId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: supportKeys.detail(kind, threadId) });
      void qc.invalidateQueries({ queryKey: supportKeys.myLists(kind) });
      void qc.invalidateQueries({ queryKey: supportKeys.adminLists(kind) });
    },
  });
}

export function useSetSenderBlocked(
  kind: ThreadKind,
  threadId: string,
): UseMutationResult<Thread, unknown, { blocked: boolean }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['support', kind, 'block', threadId],
    mutationFn: ({ blocked }) => threadApi(kind).setSenderBlocked(threadId, blocked),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: supportKeys.detail(kind, threadId) });
    },
  });
}
