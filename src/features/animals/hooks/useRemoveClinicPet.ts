import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { clinicDashboardKeys } from '@/features/clinicDashboard/api/queryKeys';
import type { ApiError } from '@/services/api';

import { orgAnimalKeys, organizationAnimalsApi } from '../api';

/**
 * Remove a pet from THIS clinic's Recent / All Pets (server detaches the
 * clinic's own rows — the pet, its owner and other clinics are untouched).
 * Drops every cached clinic-pet / dashboard query of the organization so the
 * lists and counters refresh.
 */
export function useRemoveClinicPet(
  organizationId: string,
): UseMutationResult<{ animalId: string; removed: true }, ApiError, { animalId: string }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['organization-animals', 'remove', organizationId],
    mutationFn: ({ animalId }) => organizationAnimalsApi.removeFromClinic(organizationId, animalId),
    onSuccess: (_data, { animalId }) => {
      qc.removeQueries({ queryKey: orgAnimalKeys.profile(organizationId, animalId) });
      void qc.invalidateQueries({ queryKey: orgAnimalKeys.forOrg(organizationId) });
      void qc.invalidateQueries({ queryKey: clinicDashboardKeys.all });
    },
  });
}
