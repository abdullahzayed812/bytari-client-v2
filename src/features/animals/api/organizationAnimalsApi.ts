import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  ClinicAnimalAccess,
  ClinicAnimalProfile,
  GrantAnimalAccessInput,
  OrganizationAnimalGrant,
  Paginated,
} from '../types';

/**
 * Thin wrappers over the clinic-facing veterinary-access routes
 * (`server/src/modules/veterinary-care/presentation/clinical.routes.ts`),
 * mounted at `/organizations/:organizationId/...`. The API client attaches auth;
 * the backend enforces organization membership + the
 * `animal.veterinary.access.{read,manage}` permission for every call.
 *
 *   GET    /organizations/:organizationId/animal-access?page&pageSize
 *   POST   /organizations/:organizationId/animal-access        { animalId }
 *   DELETE /organizations/:organizationId/animal-access/:animalId
 *   GET    /organizations/:organizationId/animals/:animalId   (clinic-visible profile)
 *
 * No endpoint here is invented. There is still NO organization-scoped animal
 * search (see MOBILE_ARCHITECTURE.md §63).
 */
export const organizationAnimalsApi = {
  async list(
    organizationId: string,
    page: number,
    pageSize: number,
  ): Promise<Paginated<OrganizationAnimalGrant>> {
    const envelope = await apiClient.requestEnvelope<OrganizationAnimalGrant[]>({
      method: 'GET',
      url: `/organizations/${organizationId}/animal-access`,
      params: { page, pageSize },
    });
    const meta = (envelope.meta ?? {}) as Partial<ApiPageMeta>;
    return {
      items: envelope.data,
      meta: {
        page: meta.page ?? page,
        pageSize: meta.pageSize ?? pageSize,
        total: meta.total ?? envelope.data.length,
        totalPages: meta.totalPages ?? 1,
      },
    };
  },

  grant(organizationId: string, input: GrantAnimalAccessInput): Promise<ClinicAnimalAccess> {
    return apiClient.post<ClinicAnimalAccess>(
      `/organizations/${organizationId}/animal-access`,
      input,
    );
  },

  /** Clinic-visible profile; 404 when the clinic holds no ACTIVE grant for the animal. */
  getProfile(organizationId: string, animalId: string): Promise<ClinicAnimalProfile> {
    return apiClient.get<ClinicAnimalProfile>(
      `/organizations/${organizationId}/animals/${animalId}`,
    );
  },

  revoke(organizationId: string, animalId: string): Promise<{ revoked: boolean }> {
    return apiClient.delete<{ revoked: boolean }>(
      `/organizations/${organizationId}/animal-access/${animalId}`,
    );
  },
};

export type OrganizationAnimalsApi = typeof organizationAnimalsApi;
