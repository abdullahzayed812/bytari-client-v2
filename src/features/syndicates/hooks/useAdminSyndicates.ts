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
