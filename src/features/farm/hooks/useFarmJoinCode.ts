import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { orgKeys } from '@/features/organizations/api';
import type { OrganizationMember } from '@/features/organizations/types';
import { ApiError } from '@/services/api';

import { farmApi, farmKeys } from '../api';
import type { FarmJoinCode, JoinFarmInput } from '../types';

/**
 * A FARM's current join code. Requires `organization.update` server-side (OWNER
 * via override) — a non-owner never reaches this and a direct hit 403s.
 */
export function useFarmJoinCode(
  organizationId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<FarmJoinCode, ApiError>({
    queryKey: farmKeys.joinCode(organizationId ?? 'unknown'),
    queryFn: () => farmApi.getJoinCode(organizationId as string),
    enabled: Boolean(organizationId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 403 || error.status === 404)) && count < 2,
  });
}

/** Rotate a FARM's join code. The previous code stops working immediately. */
export function useRegenerateFarmJoinCode(
  organizationId: string,
): UseMutationResult<FarmJoinCode, unknown, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['farm', 'join-code', 'regenerate', organizationId],
    mutationFn: () => farmApi.regenerateJoinCode(organizationId),
    onSuccess: (data) => {
      qc.setQueryData(farmKeys.joinCode(organizationId), data);
    },
  });
}

/**
 * A veterinarian joins a FARM by its code. No invitation / acceptance / owner
 * approval — the backend creates (or reactivates a LEFT) VETERINARIAN
 * membership. Idempotent for an existing ACTIVE member. Requires an APPROVED
 * veterinarian. On success the "My Organizations" list is refreshed.
 */
export function useJoinFarmByCode(): UseMutationResult<OrganizationMember, unknown, JoinFarmInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['farm', 'join'],
    mutationFn: (input: JoinFarmInput) => farmApi.joinByCode(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orgKeys.lists() });
    },
  });
}
