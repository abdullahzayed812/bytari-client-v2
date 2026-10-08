import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type { ClinicAnimalProfile, ClinicPet, ClinicPetLookup, Paginated } from '../types';

/**
 * Thin wrappers over the clinic-facing pet routes
 * (`server/src/modules/veterinary-care/presentation/clinical.routes.ts` and
 * `clinic-dashboard.routes.ts`). The backend enforces clinic membership +
 * `animal.veterinary.access.read`, and scopes everything to THIS clinic:
 *
 *   GET /organizations/:organizationId/clinic-pets?page&pageSize&search
 *   GET /organizations/:organizationId/clinic-pets/lookup?code
 *   GET /organizations/:organizationId/animals/:animalId   (clinic pet profile)
 *
 * There is no grant / link endpoint: opening a pet by its code creates nothing;
 * the clinic's own records are what put a pet in its lists.
 */
export const organizationAnimalsApi = {
  async list(
    organizationId: string,
    page: number,
    pageSize: number,
    /** Server-side match on id / short ID (exact) or name / breed / species / owner — this clinic's pets only. */
    search?: string,
  ): Promise<Paginated<ClinicPet>> {
    const envelope = await apiClient.requestEnvelope<ClinicPet[]>({
      method: 'GET',
      url: `/organizations/${organizationId}/clinic-pets`,
      params: { page, pageSize, ...(search ? { search } : {}) },
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

  /** Resolve a short public ID / scanned QR (or legacy UUID) to a pet; 404 when unknown. */
  lookup(organizationId: string, code: string): Promise<ClinicPetLookup> {
    return apiClient.get<ClinicPetLookup>(`/organizations/${organizationId}/clinic-pets/lookup`, {
      code,
    });
  },

  /** Clinic-visible profile; 404 for an unknown / listing-only animal. */
  getProfile(organizationId: string, animalId: string): Promise<ClinicAnimalProfile> {
    return apiClient.get<ClinicAnimalProfile>(
      `/organizations/${organizationId}/animals/${animalId}`,
    );
  },
};

export type OrganizationAnimalsApi = typeof organizationAnimalsApi;
