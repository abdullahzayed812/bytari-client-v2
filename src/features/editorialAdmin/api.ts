import { apiClient } from '@/services/api';
import type { PageMeta } from '@/services/api';
import type { PresignedUpload } from '@/services/files/types';

import type { EditorialInput, EditorialItem, EditorialKind, EditorialListFilter } from './types';

function readMeta(meta: unknown, page: number, pageSize: number, count: number): PageMeta {
  const m = (meta ?? {}) as Partial<PageMeta>;
  return {
    page: m.page ?? page,
    pageSize: m.pageSize ?? pageSize,
    total: m.total ?? count,
    totalPages: m.totalPages ?? 1,
  };
}

const base = (kind: EditorialKind) => `/admin/${kind}`;

/** Thin wrappers over `/admin/tips/*` and `/admin/news/*` (identical shapes). */
export const editorialAdminApi = {
  async list(
    kind: EditorialKind,
    filter: EditorialListFilter,
  ): Promise<{ items: EditorialItem[]; meta: PageMeta }> {
    const envelope = await apiClient.requestEnvelope<EditorialItem[]>({
      method: 'GET',
      url: base(kind),
      params: filter,
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, filter.page, filter.pageSize, envelope.data.length),
    };
  },
  get(kind: EditorialKind, id: string): Promise<EditorialItem> {
    return apiClient.get<EditorialItem>(`${base(kind)}/${id}`);
  },
  create(kind: EditorialKind, input: EditorialInput): Promise<EditorialItem> {
    return apiClient.post<EditorialItem>(base(kind), input);
  },
  update(kind: EditorialKind, id: string, input: EditorialInput): Promise<EditorialItem> {
    return apiClient.patch<EditorialItem>(`${base(kind)}/${id}`, input);
  },
  remove(kind: EditorialKind, id: string): Promise<unknown> {
    return apiClient.delete(`${base(kind)}/${id}`);
  },
  publish(kind: EditorialKind, id: string): Promise<EditorialItem> {
    return apiClient.post<EditorialItem>(`${base(kind)}/${id}/publish`);
  },
  /** "Unpublish" — PUBLISHED → ARCHIVED (hidden from users; can be republished). */
  archive(kind: EditorialKind, id: string): Promise<EditorialItem> {
    return apiClient.post<EditorialItem>(`${base(kind)}/${id}/archive`);
  },
  requestCoverUpload(
    kind: EditorialKind,
    id: string,
    file: { filename: string; mimeType: string; size: number },
  ): Promise<PresignedUpload> {
    return apiClient.post<PresignedUpload>(`${base(kind)}/${id}/cover/upload-url`, file);
  },
  registerCover(
    kind: EditorialKind,
    id: string,
    body: { storageKey: string; mimeType: string },
  ): Promise<EditorialItem> {
    return apiClient.post<EditorialItem>(`${base(kind)}/${id}/cover`, body);
  },
};

export const editorialAdminKeys = {
  all: ['editorial-admin'] as const,
  list: (kind: EditorialKind, filter: { status?: string; q?: string }) =>
    [...editorialAdminKeys.all, kind, 'list', filter] as const,
  detail: (kind: EditorialKind, id: string) =>
    [...editorialAdminKeys.all, kind, 'detail', id] as const,
};
