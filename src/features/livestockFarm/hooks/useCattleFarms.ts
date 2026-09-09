import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { useMyFarms } from '@/features/farm';
import { orgKeys } from '@/features/organizations';
import type { OrganizationWithDetails } from '@/features/organizations/types';

import { cattleFarmApi } from '../api';
import type { CreateCattleFarmInput } from '../types';

/** The current user's Cattle Farms — `farmSpecies === 'CATTLE'` (strict). Mirrors `useSheepFarms`. */
export function useCattleFarms() {
  return useMyFarms(['CATTLE']);
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
