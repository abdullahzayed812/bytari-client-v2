import type { OrganizationMember, OrganizationWithDetails } from '@/features/organizations/types';
import { apiClient } from '@/services/api';

import type { CreatePoultryFarmInput, FarmJoinCode, JoinFarmInput } from '../types';

/**
 * Farm-ID / join-code wrappers — 1:1 with
 * `server/src/modules/farms/presentation/farm.routes.ts`.
 *
 *   POST /organizations/join                            { joinCode }  → membership (201 new / 200 already)
 *   GET  /organizations/:organizationId/join-code                     → { joinCode }   (`organization.update`)
 *   POST /organizations/:organizationId/join-code/regenerate         → { joinCode }   (`organization.update`)
 *
 * The organization id is NEVER taken from the join body — the backend resolves
 * it from the code. Joining requires an APPROVED veterinarian; there is no
 * invitation / acceptance / owner-approval step.
 */
export const farmApi = {
  /**
   * `POST /organizations/farms` — the "Add Poultry Farm" form. The backend
   * creates the FARM organization + `farm_details` + the caller's OWNER
   * membership in one transaction and starts it PENDING (admin review). The
   * client never creates an organization, picks a type, or assigns ownership.
   */
  createFarm(input: CreatePoultryFarmInput): Promise<OrganizationWithDetails> {
    return apiClient.post<OrganizationWithDetails>('/organizations/farms', input);
  },

  joinByCode(input: JoinFarmInput): Promise<OrganizationMember> {
    return apiClient.post<OrganizationMember>('/organizations/join', {
      joinCode: input.joinCode,
    });
  },

  getJoinCode(organizationId: string): Promise<FarmJoinCode> {
    return apiClient.get<FarmJoinCode>(`/organizations/${organizationId}/join-code`);
  },

  regenerateJoinCode(organizationId: string): Promise<FarmJoinCode> {
    return apiClient.post<FarmJoinCode>(`/organizations/${organizationId}/join-code/regenerate`);
  },
};

export type FarmApi = typeof farmApi;
