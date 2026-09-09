import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type { AnimalPublication, Paginated, PublicationKind, PublicationStatus } from '../types';

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
 * `/admin/animal-publications*` — the Lost / Adoption / Mating moderation queue.
 * `list` / `get` need `animal.read`; `approve` needs `animal.approve`; `reject`
 * needs `animal.reject`. Held by ADMIN (override) or an ACTIVE ANIMAL
 * system-supervisor. The backend re-authorises every call.
 */
export const adminPublicationsApi = {
  async list(
    page: number,
    pageSize: number,
    filter: { kind?: PublicationKind; status?: PublicationStatus } = {},
  ): Promise<Paginated<AnimalPublication>> {
    const envelope = await apiClient.requestEnvelope<AnimalPublication[]>({
      method: 'GET',
      url: '/admin/animal-publications',
      params: { page, pageSize, kind: filter.kind, status: filter.status },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, page, pageSize, envelope.data.length),
    };
  },

  get(publicationId: string): Promise<AnimalPublication> {
    return apiClient.get<AnimalPublication>(`/admin/animal-publications/${publicationId}`);
  },

  approve(publicationId: string): Promise<AnimalPublication> {
    return apiClient.post<AnimalPublication>(`/admin/animal-publications/${publicationId}/approve`);
  },

  reject(publicationId: string, reason: string): Promise<AnimalPublication> {
    return apiClient.post<AnimalPublication>(`/admin/animal-publications/${publicationId}/reject`, {
      reason,
    });
  },
};

export type AdminPublicationsApi = typeof adminPublicationsApi;
