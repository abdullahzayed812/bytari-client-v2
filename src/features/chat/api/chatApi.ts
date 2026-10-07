import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';
import type { PresignedUpload } from '@/services/files/types';

import type {
  ConversationUnreadSummary,
  ChatMessage,
  Conversation,
  ConversationListFilter,
  Paginated,
  StartConversationInput,
  ChatAttachmentKind,
  ChatMessageAttachment,
  SendMessageInput,
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
    organizationId: (r.organizationId as string | null) ?? null,
    counterpartUserId: (r.counterpartUserId as string | null) ?? null,
    viewerSide: (r.viewerSide as Conversation['viewerSide']) ?? 'PET_OWNER',
    subjectType: (r.subjectType as Conversation['subjectType']) ?? null,
    subjectId: (r.subjectId as string | null) ?? null,
    status: (r.status as Conversation['status']) ?? 'OPEN',
    lastMessageAt: (r.lastMessageAt as string | null) ?? null,
    unreadCount:
      r.unreadCount === null || r.unreadCount === undefined ? null : Number(r.unreadCount),
    createdAt: String(r.createdAt ?? ''),
    updatedAt: String(r.updatedAt ?? ''),
  };
}

function toAttachment(raw: unknown): ChatMessageAttachment | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Record<string, unknown>;
  if (typeof a.url !== 'string') return null;
  return {
    kind: (a.kind as ChatMessageAttachment['kind']) ?? 'FILE',
    fileName: String(a.fileName ?? ''),
    mimeType: String(a.mimeType ?? 'application/octet-stream'),
    sizeBytes: Number(a.sizeBytes ?? 0),
    url: a.url,
    urlExpiresInSeconds: Number(a.urlExpiresInSeconds ?? 0),
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
    attachment: toAttachment(r.attachment),
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

  /** `GET /conversations/unread-summary` — badge counts (optionally one organization's). */
  getUnreadSummary(organizationId?: string): Promise<ConversationUnreadSummary> {
    return apiClient.get<ConversationUnreadSummary>(
      '/conversations/unread-summary',
      organizationId ? { organizationId } : undefined,
    );
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

  /** Text, or `{ body?, attachment? }` (attachment uploaded first via `requestAttachmentUpload`). */
  async sendMessage(
    conversationId: string,
    input: string | SendMessageInput,
  ): Promise<ChatMessage> {
    const payload = typeof input === 'string' ? { body: input } : input;
    return toMessage(
      await apiClient.post<unknown>(`/conversations/${conversationId}/messages`, payload),
    );
  },

  /** Presigned PUT for one attachment, scoped server-side to this conversation. */
  requestAttachmentUpload(
    conversationId: string,
    input: { kind: ChatAttachmentKind; filename: string; mimeType: string; size: number },
  ): Promise<PresignedUpload> {
    return apiClient.post<PresignedUpload>(
      `/conversations/${conversationId}/attachments/upload-url`,
      input,
    );
  },

  /** Fresh signed URL for a message's attachment (access re-checked server-side). */
  async getAttachment(
    conversationId: string,
    messageId: string,
  ): Promise<ChatMessageAttachment | null> {
    return toAttachment(
      await apiClient.get<unknown>(
        `/conversations/${conversationId}/messages/${messageId}/attachment`,
      ),
    );
  },

  markRead(conversationId: string, messageId: string): Promise<void> {
    return apiClient.post(`/conversations/${conversationId}/read`, { messageId });
  },

  deleteMessage(messageId: string): Promise<ChatMessage> {
    return apiClient.delete<unknown>(`/messages/${messageId}`).then((r) => toMessage(r));
  },

  /** "إيقاف المحادثة" — close a PET_OWNER_VETERINARIAN marketplace deal conversation. */
  /** Clinic pauses (`false`) / resumes (`true`) its chat with a pet owner. */
  async setClinicActive(conversationId: string, active: boolean): Promise<Conversation> {
    return toConversation(
      await apiClient.post<unknown>(`/conversations/${conversationId}/clinic-active`, { active }),
    );
  },

  async close(conversationId: string): Promise<Conversation> {
    return toConversation(await apiClient.post<unknown>(`/conversations/${conversationId}/close`));
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
