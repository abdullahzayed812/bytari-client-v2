import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { orgAnimalKeys, organizationAnimalsApi } from '../api';
import type { ClinicAnimalAccess, GrantAnimalAccessInput } from '../types';

/**
 * Grant this organization veterinary access to an existing animal. Does NOT
 * transfer ownership — the animal stays owned by its Pet Owner. The backend
 * validates the animal exists, the org is a CLINIC, the actor holds
 * `animal.veterinary.access.manage`, and there is no existing ACTIVE grant.
 */
export function useGrantOrganizationAnimalAccess(
  organizationId: string,
): UseMutationResult<ClinicAnimalAccess, unknown, GrantAnimalAccessInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organization-animals', 'grant', organizationId],
    mutationFn: (input: GrantAnimalAccessInput) =>
      organizationAnimalsApi.grant(organizationId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orgAnimalKeys.forOrg(organizationId) });
    },
  });
}

/** Revoke this organization's veterinary access to an animal. Medical history is kept server-side. */
export function useRevokeOrganizationAnimalAccess(
  organizationId: string,
): UseMutationResult<{ revoked: boolean }, unknown, { animalId: string }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organization-animals', 'revoke', organizationId],
    mutationFn: ({ animalId }) => organizationAnimalsApi.revoke(organizationId, animalId),
    onSuccess: (_data, { animalId }) => {
      qc.removeQueries({ queryKey: orgAnimalKeys.detail(organizationId, animalId) });
      void qc.invalidateQueries({ queryKey: orgAnimalKeys.forOrg(organizationId) });
    },
  });
}
