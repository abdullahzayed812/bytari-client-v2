import type { OrganizationWithDetails } from '@/features/organizations/types';
import { apiClient } from '@/services/api';

import type { CreatePoultryFarmInput } from '../types';

/**
 * Poultry farm creation — 1:1 with
 * `server/src/modules/farms/presentation/poultry-flock.routes.ts`'s
 * `createPoultryFarm`. Join-code / join-by-code wrappers are genuinely
 * generic and live in `@/features/farmShared`.
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
};

export type FarmApi = typeof farmApi;
