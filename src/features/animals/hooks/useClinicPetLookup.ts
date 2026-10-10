import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { ApiError } from '@/services/api';

import { orgAnimalKeys, organizationAnimalsApi } from '../api';
import type { ClinicPetLookup } from '../types';

/**
 * Open a pet by its short public ID / scanned QR (`GET …/clinic-pets/lookup`).
 * A read — it links nothing; it is a mutation only because it is triggered by
 * an explicit scan / submit. Unknown codes are a plain `404`.
 */
export function useClinicPetLookup(
  organizationId: string,
): UseMutationResult<ClinicPetLookup, ApiError, { code: string }> {
  return useMutation({
    mutationKey: ['organization-animals', 'lookup', organizationId],
    mutationFn: ({ code }) => organizationAnimalsApi.lookup(organizationId, code),
  });
}

/**
 * The same lookup as a query, for the Clinic Dashboard search: a settled,
 * well-formed code resolves straight to the pet card (no "open" step).
 * `404` (unknown / listing-only) and `403` are final — never retried.
 */
export function useClinicPetLookupQuery(
  organizationId: string,
  code: string | null,
  { enabled = true }: { enabled?: boolean } = {},
): UseQueryResult<ClinicPetLookup, ApiError> {
  return useQuery<ClinicPetLookup, ApiError>({
    queryKey: orgAnimalKeys.lookup(organizationId, code ?? ''),
    queryFn: () => organizationAnimalsApi.lookup(organizationId, code as string),
    enabled: enabled && Boolean(organizationId) && Boolean(code),
    staleTime: 30_000,
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 403 || error.status === 404)) && count < 1,
  });
}
