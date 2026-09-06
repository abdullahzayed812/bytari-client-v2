import { useMutation, useQuery, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { orgKeys, organizationsApi } from '@/features/organizations';
import type { MyOrganization, OrganizationWithDetails } from '@/features/organizations/types';
import { ApiError } from '@/services/api';

import { cattleFarmApi } from '../api';
import type { CreateCattleFarmInput } from '../types';

/** The current user's Cattle Farms. Mirrors `useSheepFarms` exactly. */
export function useCattleFarms() {
  const query = useQuery<MyOrganization[], ApiError>({
    queryKey: ['cattle-farms', 'mine'],
    queryFn: async () => {
      const { items } = await organizationsApi.listMine(1, 50);
      return items.filter((o) => o.type === 'FARM');
    },
    staleTime: 30_000,
  });
  return { ...query, farms: query.data ?? [] };
}

export function useCreateCattleFarm(): UseMutationResult<
  OrganizationWithDetails,
  unknown,
  CreateCattleFarmInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['cattle-farms', 'create'],
    mutationFn: (input: CreateCattleFarmInput) => cattleFarmApi.createFarm(input),
    onSuccess: (organization) => {
      void qc.invalidateQueries({ queryKey: ['cattle-farms'] });
      void qc.invalidateQueries({ queryKey: orgKeys.lists() });
      qc.setQueryData(orgKeys.detail(organization.id), { ...organization, myRole: 'OWNER' });
    },
  });
}
