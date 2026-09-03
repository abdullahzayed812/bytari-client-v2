import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/services/api';

import { petKeys, petsApi } from '../api';
import type { OwnershipRecord } from '../types';

/**
 * A pet's ownership history (oldest first, each with the resolved `owner`).
 * Requires the caller to be the current owner or ADMIN — a `404` / `403` is not
 * retried; the screen shows a neutral state.
 */
export function usePetOwnershipHistory(
  petId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<OwnershipRecord[], ApiError>({
    queryKey: petKeys.ownership(petId ?? 'unknown'),
    queryFn: () => petsApi.ownershipHistory(petId as string),
    enabled: Boolean(petId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}
