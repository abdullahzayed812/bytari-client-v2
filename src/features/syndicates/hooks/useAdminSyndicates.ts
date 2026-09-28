import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/services/api';

import { adminSyndicatesApi, syndicateKeys } from '../api';
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
