import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/services/api';

import { adminSyndicatesApi, syndicateKeys, syndicatesApi } from '../api';
import type { CreateSyndicateInput, PublicSyndicate } from '../types';

/** `POST /admin/syndicates` — ADMIN only. */
export function useCreateSyndicateAdmin() {
  const qc = useQueryClient();
  return useMutation<PublicSyndicate, ApiError, CreateSyndicateInput>({
    mutationFn: (input) => adminSyndicatesApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: syndicateKeys.syndicates() }),
  });
}

/** `DELETE /admin/syndicates/:id` — ADMIN only (soft delete). */
export function useDeleteSyndicate() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (organizationId) => adminSyndicatesApi.remove(organizationId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: syndicateKeys.all });
      void qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

/** `PUT /admin/syndicates/:id/pin` — pin / unpin on the Veterinarian Home. */
export function useSetSyndicatePinned() {
  const qc = useQueryClient();
  return useMutation<PublicSyndicate, ApiError, { organizationId: string; pinned: boolean }>({
    mutationFn: ({ organizationId, pinned }) =>
      adminSyndicatesApi.setPinned(organizationId, pinned),
    onSuccess: (s) => {
      qc.setQueryData(syndicateKeys.syndicate(s.id), (cur: PublicSyndicate | undefined) =>
        cur ? { ...cur, pinnedToHome: s.pinnedToHome } : s,
      );
      void qc.invalidateQueries({ queryKey: syndicateKeys.pinned() });
    },
  });
}

/** Syndicates pinned to the Veterinarian Home (bottom section). */
export function usePinnedSyndicates(options: { enabled?: boolean } = {}) {
  return useQuery<PublicSyndicate[], ApiError>({
    queryKey: syndicateKeys.pinned(),
    queryFn: () => syndicatesApi.listPinned(),
    enabled: options.enabled ?? true,
    staleTime: 60_000,
  });
}
