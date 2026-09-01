import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { ApiError } from '@/services/api';

import { petKeys, petsApi } from '../api';
import type { OwnershipRecord, TransferOwnershipInput } from '../types';

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

/**
 * Transfer a pet to another user. No optimistic update — on server success the
 * pet leaves the caller's list, so the detail + list + history queries are
 * invalidated (§38). The backend is authoritative for who may transfer.
 */
export function useTransferOwnership(
  petId: string,
): UseMutationResult<OwnershipRecord, unknown, TransferOwnershipInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['pets', 'transfer', petId],
    mutationFn: (input: TransferOwnershipInput) => petsApi.transferOwnership(petId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: petKeys.lists() });
      void qc.invalidateQueries({ queryKey: petKeys.detail(petId) });
      void qc.invalidateQueries({ queryKey: petKeys.ownership(petId) });
    },
  });
}
