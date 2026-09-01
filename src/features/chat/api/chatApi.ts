import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  ChatMessage,
  Conversation,
  ConversationListFilter,
  Paginated,
  StartConversationInput,
} from '../types';

function readMeta(meta: unknown, page: number, pageSize: number, count: number): ApiPageMeta {
  const m = (meta ?? {}) as Partial<ApiPageMeta>;
  return {
    page: m.page ?? page,
    pageSize: m.pageSize ?? pageSize,
    total: m.total ?? count,
    totalPages: m.totalPages ?? 1,
  };
}

function toConversation(raw: unknown): Conversation {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    type: (r.type as Conversation['type']) ?? 'PET_OWNER_CLINIC',
    organizationId: String(r.organizationId ?? ''),
    counterpartUserId: (r.counterpartUserId as string | null) ?? null,
    viewerSide: (r.viewerSide as Conversation['viewerSide']) ?? 'PET_OWNER',
    lastMessageAt: (r.lastMessageAt as string | null) ?? null,
    unreadCount:
      r.unreadCount === null || r.unreadCount === undefined ? null : Number(r.unreadCount),
    createdAt: String(r.createdAt ?? ''),
    updatedAt: String(r.updatedAt ?? ''),
  };
}

function toMessage(raw: unknown): ChatMessage {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    conversationId: String(r.conversationId ?? ''),
    senderUserId: String(r.senderUserId ?? ''),
    body: (r.body as string | null) ?? null,
    type: (r.type as ChatMessage['type']) ?? 'TEXT',
    deletedAt: (r.deletedAt as string | null) ?? null,
    createdAt: String(r.createdAt ?? ''),
  };
}

/**
 * Chat wrappers — 1:1 with `server/src/modules/chat`. Access is relationship-
 * scoped; a non-participant id is a 404, never a foreign row. `senderUserId` /
 * `createdBy` / message `type=SYSTEM` are all server-derived.
 *
 *   GET    /conversations?page&pageSize&organizationId
 *   GET    /conversations/:id
 *   GET    /conversations/:id/messages?page&pageSize
 *   POST   /conversations/:id/messages          { body }
 *   POST   /conversations/:id/read              { messageId }
 *   DELETE /messages/:messageId                 (own message → soft delete)
 *   POST   /organizations/:orgId/conversations  { targetUserId? }  (start / fetch)
 */
export const chatApi = {
  async listConversations(filter: ConversationListFilter): Promise<Paginated<Conversation>> {
    const envelope = await apiClient.requestEnvelope<unknown[]>({
      method: 'GET',
      url: '/conversations',
      params: {
        page: filter.page,
        pageSize: filter.pageSize,
        organizationId: filter.organizationId,
      },
    });
    const items = (envelope.data ?? []).map(toConversation);
    return { items, meta: readMeta(envelope.meta, filter.page, filter.pageSize, items.length) };
  },

  async getConversation(conversationId: string): Promise<Conversation> {
    return toConversation(await apiClient.get<unknown>(`/conversations/${conversationId}`));
  },

  async listMessages(
    conversationId: string,
    page: number,
    pageSize: number,
  ): Promise<Paginated<ChatMessage>> {
    const envelope = await apiClient.requestEnvelope<unknown[]>({
      method: 'GET',
      url: `/conversations/${conversationId}/messages`,
      params: { page, pageSize },
    });
    const items = (envelope.data ?? []).map(toMessage);
    return { items, meta: readMeta(envelope.meta, page, pageSize, items.length) };
  },

  async sendMessage(conversationId: string, body: string): Promise<ChatMessage> {
    return toMessage(
      await apiClient.post<unknown>(`/conversations/${conversationId}/messages`, { body }),
    );
  },

  markRead(conversationId: string, messageId: string): Promise<void> {
    return apiClient.post(`/conversations/${conversationId}/read`, { messageId });
  },

  deleteMessage(messageId: string): Promise<ChatMessage> {
    return apiClient.delete<unknown>(`/messages/${messageId}`).then((r) => toMessage(r));
  },

  async start(input: StartConversationInput): Promise<Conversation> {
    return toConversation(
      await apiClient.post<unknown>(`/organizations/${input.organizationId}/conversations`, {
        targetUserId: input.targetUserId,
      }),
    );
  },
};

export type ChatApi = typeof chatApi;
