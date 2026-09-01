import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { medicalKeys, vaccinationsApi } from '../api';
import type { Vaccination, VaccinationInput } from '../types';

/** Vaccination mutations — CLINIC context only. Same invalidation rules as medical records (§33). */

export function useCreateVaccination(
  organizationId: string,
  animalId: string,
): UseMutationResult<Vaccination, unknown, VaccinationInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['medical', 'vaccinations', 'create', organizationId, animalId],
    mutationFn: (body: VaccinationInput) => vaccinationsApi.create(organizationId, animalId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: medicalKeys.vaccinations(animalId) });
    },
  });
}

export function useUpdateVaccination(
  organizationId: string,
  animalId: string,
): UseMutationResult<Vaccination, unknown, { vaccinationId: string; body: VaccinationInput }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['medical', 'vaccinations', 'update', organizationId, animalId],
    mutationFn: ({ vaccinationId, body }) =>
      vaccinationsApi.update(organizationId, animalId, vaccinationId, body),
    onSuccess: (_data, { vaccinationId }) => {
      void qc.invalidateQueries({ queryKey: medicalKeys.vaccination(animalId, vaccinationId) });
      void qc.invalidateQueries({ queryKey: medicalKeys.vaccinations(animalId) });
    },
  });
}

export function useDeleteVaccination(
  organizationId: string,
  animalId: string,
): UseMutationResult<{ deleted: boolean }, unknown, { vaccinationId: string }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['medical', 'vaccinations', 'delete', organizationId, animalId],
    mutationFn: ({ vaccinationId }) =>
      vaccinationsApi.remove(organizationId, animalId, vaccinationId),
    onSuccess: (_data, { vaccinationId }) => {
      qc.removeQueries({ queryKey: medicalKeys.vaccination(animalId, vaccinationId) });
      void qc.invalidateQueries({ queryKey: medicalKeys.vaccinations(animalId) });
    },
  });
}
