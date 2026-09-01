import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/services/api';

import { petKeys, petsApi } from '../api';
import type { Pet } from '../types';

/**
 * Single pet detail. A `petId` belonging to another user comes back as `404`
 * from the backend (ownership is hidden, not surfaced as 403) — the screen
 * renders a "not found" state, never an authorization detail.
 */
export function usePet(petId: string | undefined, options: { enabled?: boolean } = {}) {
  return useQuery<Pet, ApiError>({
    queryKey: petKeys.detail(petId ?? 'unknown'),
    queryFn: () => petsApi.get(petId as string),
    enabled: Boolean(petId) && (options.enabled ?? true),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });
}
