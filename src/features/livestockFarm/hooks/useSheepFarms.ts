import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { useMyFarms } from '@/features/farm';
import { orgKeys } from '@/features/organizations';
import type { OrganizationWithDetails } from '@/features/organizations/types';

import { sheepFarmApi } from '../api';
import type { CreateSheepFarmInput } from '../types';

/**
 * The current user's Sheep Farms — FARM organizations whose `farmSpecies` is
 * `SHEEP` (strict; cattle / mixed / legacy farms excluded). `farmSpecies` comes
 * straight from `GET /organizations`.
 */
export function useSheepFarms() {
  return useMyFarms(['SHEEP']);
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
