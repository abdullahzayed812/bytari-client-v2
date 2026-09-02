import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  AnimalPublication,
  CreateInteractionInput,
  CreatePublicationInput,
  Paginated,
  PublicationInteraction,
  PublicationKind,
  PublicPublication,
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
 */
export const publicationsApi = {
  // --- public browse (APPROVED only, ALL users, never scoped to the caller) ---
  async listPublic(
    page: number,
    pageSize: number,
    filter: { kind?: PublicationKind; species?: string; search?: string } = {},
  ): Promise<Paginated<PublicPublication>> {
    const envelope = await apiClient.requestEnvelope<PublicPublication[]>({
      method: 'GET',
      url: '/animal-publications',
      params: { page, pageSize, kind: filter.kind, species: filter.species, search: filter.search },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, page, pageSize, envelope.data.length),
    };
  },

  getPublic(publicationId: string): Promise<PublicPublication> {
    return apiClient.get<PublicPublication>(`/animal-publications/${publicationId}`);
  },

  /** "طلب التبني" / "طلب تزاوج" / "ابلاغ عن مشاهدة" — any user except the listing's own owner. */
  createInteraction(
    publicationId: string,
    input: CreateInteractionInput,
  ): Promise<PublicationInteraction> {
    return apiClient.post<PublicationInteraction>(
      `/animal-publications/${publicationId}/interactions`,
      input,
    );
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
    return apiClient.post<AnimalPublication>(`/animals/${animalId}/publications`, input);
  },
};

export type PublicationsApi = typeof publicationsApi;
