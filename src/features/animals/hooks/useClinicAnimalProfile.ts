import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/services/api';

import { orgAnimalKeys, organizationAnimalsApi } from '../api';
import type { ClinicAnimalProfile } from '../types';

/**
 * The clinic-visible profile of one animal
 * (`GET /organizations/:organizationId/animals/:animalId`). A `404` means an
 * unknown / listing-only animal; a `403` means the caller lacks
 * `animal.veterinary.access.read` — neither is retried.
 */
export function useClinicAnimalProfile(
  organizationId: string | undefined,
  animalId: string | undefined,
) {
  return useQuery<ClinicAnimalProfile, ApiError>({
    queryKey: orgAnimalKeys.profile(organizationId ?? 'unknown', animalId ?? 'unknown'),
    queryFn: () => organizationAnimalsApi.getProfile(organizationId as string, animalId as string),
    enabled: Boolean(organizationId) && Boolean(animalId),
    staleTime: 15_000,
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 403 || error.status === 404)) && count < 2,
  });
}
