import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import { SUPPORT_KIND_META } from '../constants';
import type {
  AdminThreadListFilter,
  AiSettings,
  CreateConsultationInput,
  CreateInquiryInput,
  CreateSupportInput,
  Paginated,
  SendMessageInput,
  Thread,
  ThreadKind,
  ThreadListFilter,
  ThreadMessage,
  UpdateAiSettingsInput,
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

/** The message DTO uses `threadId`; older docs said `consultationId`/`inquiryId` — accept both. */
function normalizeMessage(raw: unknown): ThreadMessage {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    threadId: String(r.threadId ?? r.consultationId ?? r.inquiryId ?? r.supportId ?? ''),
    senderUserId: (r.senderUserId as string | null) ?? null,
    source: r.source as ThreadMessage['source'],
    body: (r.body as string | null) ?? null,
    deletedAt: (r.deletedAt as string | null) ?? null,
    createdAt: String(r.createdAt ?? ''),
  };
}

/**
 * Consultation / Inquiry wrappers. One factory per kind — the URL prefix is the
 * kind's plural slug (`/consultations` or `/inquiries`); the admin surface is
 * `/admin/<slug>`. `createdBy` / `senderUserId` / message `source` are ALWAYS
 * server-derived, never in a body.
 *
 *   GET  /<slug>?page&pageSize&status                 listMine (own threads only)
 *   POST /<slug>                                      create ({ body, animalId? } | { body })
 *   GET  /<slug>/:id                                  CREATOR or RESPONDER (else 404)
 *   GET  /<slug>/:id/messages?page&pageSize           CREATOR or RESPONDER
 *   POST /<slug>/:id/messages                         { body }
 *   POST /<slug>/:id/{close,block,unblock}            responder / admin
 *   GET  /admin/<slug>?page&pageSize&status&createdBy adminRead perm / supervisor domain
 *   GET  /admin/<slug>/:id                            adminRead perm
 */
export function makeThreadApi(kind: ThreadKind) {
  const slug = SUPPORT_KIND_META[kind].slug;

  return {
    async listMine(filter: ThreadListFilter): Promise<Paginated<Thread>> {
      const envelope = await apiClient.requestEnvelope<Thread[]>({
        method: 'GET',
        url: `/${slug}`,
        params: { page: filter.page, pageSize: filter.pageSize, status: filter.status },
      });
      return {
        items: envelope.data,
        meta: readMeta(envelope.meta, filter.page, filter.pageSize, envelope.data.length),
      };
    },

    get(threadId: string): Promise<Thread> {
      return apiClient.get<Thread>(`/${slug}/${threadId}`);
    },

    async listMessages(
      threadId: string,
      page: number,
      pageSize: number,
    ): Promise<Paginated<ThreadMessage>> {
      const envelope = await apiClient.requestEnvelope<unknown[]>({
        method: 'GET',
        url: `/${slug}/${threadId}/messages`,
        params: { page, pageSize },
      });
      const items = (envelope.data ?? []).map(normalizeMessage);
      return { items, meta: readMeta(envelope.meta, page, pageSize, items.length) };
    },

    create(
      body: CreateConsultationInput | CreateInquiryInput | CreateSupportInput,
    ): Promise<Thread> {
      return apiClient.post<Thread>(`/${slug}`, body);
    },

    async sendMessage(threadId: string, input: SendMessageInput): Promise<ThreadMessage> {
      return normalizeMessage(
        await apiClient.post<unknown>(`/${slug}/${threadId}/messages`, { body: input.body }),
      );
    },

    close(threadId: string): Promise<Thread> {
      return apiClient.post<Thread>(`/${slug}/${threadId}/close`, {});
    },

    setSenderBlocked(threadId: string, blocked: boolean): Promise<Thread> {
      return apiClient.post<Thread>(`/${slug}/${threadId}/${blocked ? 'block' : 'unblock'}`, {});
    },

    async listAdmin(filter: AdminThreadListFilter): Promise<Paginated<Thread>> {
      const envelope = await apiClient.requestEnvelope<Thread[]>({
        method: 'GET',
        url: `/admin/${slug}`,
        params: {
          page: filter.page,
          pageSize: filter.pageSize,
          status: filter.status,
          createdBy: filter.createdBy,
        },
      });
      return {
        items: envelope.data,
        meta: readMeta(envelope.meta, filter.page, filter.pageSize, envelope.data.length),
      };
    },

    getAdmin(threadId: string): Promise<Thread> {
      return apiClient.get<Thread>(`/admin/${slug}/${threadId}`);
    },
  };
}

export type ThreadApi = ReturnType<typeof makeThreadApi>;

export const consultationApi = makeThreadApi('CONSULTATION');
export const inquiryApi = makeThreadApi('INQUIRY');
export const supportMessageApi = makeThreadApi('SUPPORT');
export function threadApi(kind: ThreadKind): ThreadApi {
  if (kind === 'CONSULTATION') return consultationApi;
  if (kind === 'INQUIRY') return inquiryApi;
  return supportMessageApi;
}

/** Admin-only AI toggle (`/admin/ai-settings`, `ai.settings.manage`). */
export const aiSettingsApi = {
  get(): Promise<AiSettings> {
    return apiClient.get<AiSettings>('/admin/ai-settings');
  },
  update(input: UpdateAiSettingsInput): Promise<AiSettings> {
    return apiClient.patch<AiSettings>('/admin/ai-settings', input);
  },
};
