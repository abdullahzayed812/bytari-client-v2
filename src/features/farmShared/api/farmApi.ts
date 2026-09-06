import type { FarmJoinCode, JoinFarmInput } from '@/features/farm/types';
import type { OrganizationMember } from '@/features/organizations/types';
import { apiClient } from '@/services/api';


/**
 * Farm-ID / join-code wrappers — 1:1 with
 * `server/src/modules/farms/presentation/farm.routes.ts`. Genuinely generic —
 * a join code identifies any FARM organization, regardless of species.
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
