import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import type { ApiError } from '@/services/api';

import { organizationAnimalsApi } from '../api';
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
