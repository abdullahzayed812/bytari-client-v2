import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  ChatRoomDetail,
  ChatRoomMember,
  ChatRoomSummary,
  ContentReport,
  CreateChatRoomInput,
  ListChatRoomsFilter,
  Paginated,
  SubmitReportInput,
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

/**
 * Global Chat wrappers — 1:1 with `server/src/modules/chat-rooms` +
 * `server/src/modules/reports`. Joining/leaving/muting is open to any
 * authenticated user; rules/pin/moderator-message-delete require the
 * organization-scoped `chat_room.*` permission (backend-enforced).
 *
 *   GET    /chat-rooms?search&page&pageSize
 *   GET    /chat-rooms/:organizationId
 *   POST   /chat-rooms/:organizationId/join
 *   POST   /chat-rooms/:organizationId/leave
 *   POST   /chat-rooms/:organizationId/mute            { muted }
 *   PATCH  /chat-rooms/:organizationId/rules           { rules }
 *   POST   /chat-rooms/:organizationId/messages/:messageId/pin
 *   DELETE /chat-rooms/:organizationId/pinned-message
 *   DELETE /chat-rooms/:organizationId/messages/:messageId
 *   POST   /admin/chat-rooms                           { name, description?, rules? }
 *   POST   /reports                                    { targetType, targetId, reason, details? }
 */
export const globalChatApi = {
  async list(filter: ListChatRoomsFilter): Promise<Paginated<ChatRoomSummary>> {
    const envelope = await apiClient.requestEnvelope<ChatRoomSummary[]>({
      method: 'GET',
      url: '/chat-rooms',
      params: { page: filter.page, pageSize: filter.pageSize, search: filter.search },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, filter.page, filter.pageSize, envelope.data.length),
    };
  },

  get(organizationId: string): Promise<ChatRoomDetail> {
    return apiClient.get<ChatRoomDetail>(`/chat-rooms/${organizationId}`);
  },

  async listMembers(
    organizationId: string,
    page: number,
    pageSize: number,
  ): Promise<Paginated<ChatRoomMember>> {
    const envelope = await apiClient.requestEnvelope<ChatRoomMember[]>({
      method: 'GET',
      url: `/chat-rooms/${organizationId}/members`,
      params: { page, pageSize },
    });
    return { items: envelope.data, meta: readMeta(envelope.meta, page, pageSize, envelope.data.length) };
  },

  join(organizationId: string): Promise<ChatRoomDetail> {
    return apiClient.post<ChatRoomDetail>(`/chat-rooms/${organizationId}/join`);
  },

  leave(organizationId: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(`/chat-rooms/${organizationId}/leave`);
  },

  setMuted(organizationId: string, muted: boolean): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(`/chat-rooms/${organizationId}/mute`, { muted });
  },

  updateRules(organizationId: string, rules: string | null): Promise<{ success: boolean }> {
    return apiClient.patch<{ success: boolean }>(`/chat-rooms/${organizationId}/rules`, { rules });
  },

  pinMessage(organizationId: string, messageId: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(
      `/chat-rooms/${organizationId}/messages/${messageId}/pin`,
    );
  },

  unpinMessage(organizationId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/chat-rooms/${organizationId}/pinned-message`);
  },

  deleteMessage(organizationId: string, messageId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(
      `/chat-rooms/${organizationId}/messages/${messageId}`,
    );
  },

  createAdmin(input: CreateChatRoomInput): Promise<ChatRoomDetail> {
    return apiClient.post<ChatRoomDetail>('/admin/chat-rooms', input);
  },

  submitReport(input: SubmitReportInput): Promise<ContentReport> {
    return apiClient.post<ContentReport>('/reports', input);
  },
};

export type GlobalChatApi = typeof globalChatApi;
