import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/hooks';
import { realtimeClient } from '@/services/realtime';

import { chatKeys } from '../api';

/**
 * Live updates for ONE open conversation, through the **existing** realtime
 * transport (`src/services/realtime`, connected by `RealtimeGate`). Joins the
 * backend `conversation:<id>` room and, on `chat.message.created` /
 * `chat.message.deleted`, invalidates that conversation's messages + detail
 * queries so the REST hooks refetch. Payloads are ids-only — the REST refetch
 * is the single source of truth, so a message from the POST response and the
 * realtime event can never render twice (§21). No new websocket code (§23).
 */
export function useConversationRealtime(conversationId: string | undefined): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;
    const room = `conversation:${conversationId}`;

    const refetch = (): void => {
      void qc.invalidateQueries({ queryKey: chatKeys.messages(conversationId) });
      void qc.invalidateQueries({ queryKey: chatKeys.detail(conversationId) });
    };

    const subs = [
      realtimeClient.on('chat.message.created', refetch, room),
      realtimeClient.on('chat.message.deleted', refetch),
    ];
    return () => subs.forEach((s) => s.unsubscribe());
  }, [conversationId, qc]);
}

/**
 * App-wide: refresh the conversation LIST when a new conversation is created for
 * this user (`chat.conversation.created` → the caller's auto-joined `user:<id>`
 * room). Mounted once by `NotificationsGate`. Cleaned up on unmount / logout.
 */
export function useChatListRealtime(): void {
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    const sub = realtimeClient.on('chat.conversation.created', () => {
      void qc.invalidateQueries({ queryKey: chatKeys.lists() });
    });
    return () => sub.unsubscribe();
  }, [isAuthenticated, qc]);
}
