import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  AnimalPublication,
  CreatePublicationInput,
  Paginated,
  PublicPublication,
  PublicationKind,
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
 * Thin wrappers — 1:1 with
 * `server/src/modules/animals/presentation/publication.routes.ts`.
 * No endpoint is invented; there is no update / delete / close / mark-found
 * endpoint, and no cross-animal "my publications" endpoint (§9/§14/§20).
 */
export const publicationsApi = {
  // --- authenticated public browse (APPROVED only, no owner PII) ---
  async listPublic(
    page: number,
    pageSize: number,
    kind?: PublicationKind,
  ): Promise<Paginated<PublicPublication>> {
    const envelope = await apiClient.requestEnvelope<PublicPublication[]>({
      method: 'GET',
      url: '/animal-publications',
      params: { page, pageSize, kind },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, page, pageSize, envelope.data.length),
    };
  },

  getPublic(publicationId: string): Promise<PublicPublication> {
    return apiClient.get<PublicPublication>(`/animal-publications/${publicationId}`);
  },

  // --- owner-facing (per animal, every status) ---
  async listForAnimal(
    animalId: string,
    page: number,
    pageSize: number,
  ): Promise<Paginated<AnimalPublication>> {
    const envelope = await apiClient.requestEnvelope<AnimalPublication[]>({
      method: 'GET',
      url: `/animals/${animalId}/publications`,
      params: { page, pageSize },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, page, pageSize, envelope.data.length),
    };
  },

  getForAnimal(animalId: string, publicationId: string): Promise<AnimalPublication> {
    return apiClient.get<AnimalPublication>(`/animals/${animalId}/publications/${publicationId}`);
  },

  create(animalId: string, input: CreatePublicationInput): Promise<AnimalPublication> {
    return apiClient.post<AnimalPublication>(`/animals/${animalId}/publications`, {
      kind: input.kind,
      note: input.note,
    });
  },
};

export type PublicationsApi = typeof publicationsApi;
