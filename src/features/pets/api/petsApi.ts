import { apiClient } from '@/services/api';
import type { PageMeta } from '@/services/api';
import type { PresignedUpload } from '@/services/files/types';

import type {
  CreatePetInput,
  OwnershipRecord,
  Pet,
  PetListFilter,
  PetListPage,
  TransferOwnershipInput,
  UpdatePetInput,
} from '../types';

/**
 * Thin wrappers over `/api/v1/animals/*`. No token / ownership logic — the API
 * client attaches auth; the backend derives + enforces ownership.
 *
 * Contract: `server/src/modules/animals/presentation/animal.routes.ts`.
 *  - `GET  /animals`         → the caller's own animals (owner-scoped, paginated)
 *  - `POST /animals`         → 201; caller becomes the owner (no ownerId in body)
 *  - `GET  /animals/:id`     → owner-or-admin; cross-user access is hidden as 404
 *  - `PATCH /animals/:id`    → owner-or-admin; profile fields only
 *  - `DELETE /animals/:id`   → owner-or-admin; soft deactivate (status→DEACTIVATED)
 */
export const petsApi = {
  async list(filter: PetListFilter): Promise<PetListPage> {
    const envelope = await apiClient.requestEnvelope<Pet[]>({
      method: 'GET',
      url: '/animals',
      params: {
        page: filter.page,
        pageSize: filter.pageSize,
        status: filter.status,
        species: filter.species,
        search: filter.search,
      },
    });
    const meta = (envelope.meta ?? {}) as Partial<PageMeta>;
    return {
      items: envelope.data,
      meta: {
        page: meta.page ?? filter.page,
        pageSize: meta.pageSize ?? filter.pageSize,
        total: meta.total ?? envelope.data.length,
        totalPages: meta.totalPages ?? 1,
      },
    };
  },

  get(petId: string): Promise<Pet> {
    return apiClient.get<Pet>(`/animals/${petId}`);
  },

  create(input: CreatePetInput): Promise<Pet> {
    return apiClient.post<Pet>('/animals', input);
  },

  update(petId: string, input: UpdatePetInput): Promise<Pet> {
    return apiClient.patch<Pet>(`/animals/${petId}`, input);
  },

  /** Soft-deactivate. Returns the pet with `status: 'DEACTIVATED'`. */
  deactivate(petId: string): Promise<Pet> {
    return apiClient.delete<Pet>(`/animals/${petId}`);
  },

  /**
   * Full ownership history, oldest first — each row carries the resolved
   * `owner` summary. `GET /animals/:id/ownership/history` (current owner or
   * ADMIN; `animal.ownership.read`).
   */
  ownershipHistory(petId: string): Promise<OwnershipRecord[]> {
    return apiClient.get<OwnershipRecord[]>(`/animals/${petId}/ownership/history`);
  },

  /**
   * Transfer to another user. `POST /animals/:id/ownership/transfer` — the
   * server verifies the caller is the current owner and the recipient is an
   * ACTIVE user; returns the new current ownership record.
   */
  transferOwnership(petId: string, input: TransferOwnershipInput): Promise<OwnershipRecord> {
    return apiClient.post<OwnershipRecord>(`/animals/${petId}/ownership/transfer`, {
      toUserId: input.toUserId,
      reason: input.reason,
    });
  },

  // --- gallery (up to 8 photos) ---------------------------------------

  requestGalleryUploadUrl(
    petId: string,
    input: { filename: string; mimeType: string; size: number },
  ): Promise<PresignedUpload> {
    return apiClient.post<PresignedUpload>(`/animals/${petId}/gallery/upload-url`, input);
  },

  finalizeGalleryImage(
    petId: string,
    input: { storageKey: string; mimeType: string },
  ): Promise<Pet> {
    return apiClient.post<Pet>(`/animals/${petId}/gallery`, input);
  },

  removeGalleryImage(petId: string, storageKey: string): Promise<Pet> {
    return apiClient.delete<Pet>(
      `/animals/${petId}/gallery?storageKey=${encodeURIComponent(storageKey)}`,
    );
  },
};

export type PetsApi = typeof petsApi;
