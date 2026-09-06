import { useMutation, useQuery, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { orgKeys, organizationsApi } from '@/features/organizations';
import type { MyOrganization, OrganizationWithDetails } from '@/features/organizations/types';
import { ApiError } from '@/services/api';

import { sheepFarmApi } from '../api';
import type { CreateSheepFarmInput } from '../types';

/**
 * The current user's Sheep Farms — FARM organizations they own or are an
 * ACTIVE member of. Backed by `GET /organizations` (membership-scoped); the
 * FARM filter is applied client-side, mirroring `usePoultryFarms` exactly.
 * Species (sheep vs. cattle vs. poultry) is NOT in this list projection —
 * each row resolves its own species via `useFarmProfile` when rendered.
 */
export function useSheepFarms() {
  const query = useQuery<MyOrganization[], ApiError>({
    queryKey: ['sheep-farms', 'mine'],
    queryFn: async () => {
      const { items } = await organizationsApi.listMine(1, 50);
      return items.filter((o) => o.type === 'FARM');
    },
    staleTime: 30_000,
  });
  return { ...query, farms: query.data ?? [] };
}

export function useCreateSheepFarm(): UseMutationResult<
  OrganizationWithDetails,
  unknown,
  CreateSheepFarmInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['sheep-farms', 'create'],
    mutationFn: (input: CreateSheepFarmInput) => sheepFarmApi.createFarm(input),
    onSuccess: (organization) => {
      void qc.invalidateQueries({ queryKey: ['sheep-farms'] });
      void qc.invalidateQueries({ queryKey: orgKeys.lists() });
      qc.setQueryData(orgKeys.detail(organization.id), { ...organization, myRole: 'OWNER' });
    },
  });
}
