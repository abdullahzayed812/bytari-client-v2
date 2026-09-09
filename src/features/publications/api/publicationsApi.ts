import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  AnimalPublication,
  CreateInteractionInput,
  CreatePublicationInput,
  MyPublication,
  Paginated,
  PublicationInteraction,
  PublicationKind,
  PublicationStatus,
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

  /**
   * "My listings" — the caller's OWN publications of every status. The owner id
   * is derived server-side from the session, never sent by the client.
   */
  async listMine(
    page: number,
    pageSize: number,
    filter: { kind?: PublicationKind; status?: PublicationStatus } = {},
  ): Promise<Paginated<MyPublication>> {
    const envelope = await apiClient.requestEnvelope<MyPublication[]>({
      method: 'GET',
      url: '/animal-publications/mine',
      params: { page, pageSize, kind: filter.kind, status: filter.status },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, page, pageSize, envelope.data.length),
    };
  },

  /** Delete a listing — the backend allows only its creator, an ADMIN, or an ANIMAL supervisor. */
  remove(publicationId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/animal-publications/${publicationId}`);
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
