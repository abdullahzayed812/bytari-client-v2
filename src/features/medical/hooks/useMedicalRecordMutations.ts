import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { medicalKeys, medicalRecordsApi } from '../api';
import type { MedicalRecord, MedicalRecordInput } from '../types';

/**
 * Medical-record mutations — CLINIC context only (owners are read-only). The
 * backend takes `organizationId` / `animalId` from the route and
 * `recordedByUserId` from the JWT; these hooks never send them in a body.
 * No optimistic updates (§32) — mutate → server success → invalidate.
 */

export function useCreateMedicalRecord(
  organizationId: string,
  animalId: string,
): UseMutationResult<MedicalRecord, unknown, MedicalRecordInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['medical', 'records', 'create', organizationId, animalId],
    mutationFn: (body: MedicalRecordInput) =>
      medicalRecordsApi.create(organizationId, animalId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: medicalKeys.records(animalId) });
    },
  });
}

export function useUpdateMedicalRecord(
  organizationId: string,
  animalId: string,
): UseMutationResult<MedicalRecord, unknown, { recordId: string; body: MedicalRecordInput }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['medical', 'records', 'update', organizationId, animalId],
    mutationFn: ({ recordId, body }) =>
      medicalRecordsApi.update(organizationId, animalId, recordId, body),
    onSuccess: (_data, { recordId }) => {
      void qc.invalidateQueries({ queryKey: medicalKeys.record(animalId, recordId) });
      void qc.invalidateQueries({ queryKey: medicalKeys.records(animalId) });
    },
  });
}

export function useDeleteMedicalRecord(
  organizationId: string,
  animalId: string,
): UseMutationResult<{ deleted: boolean }, unknown, { recordId: string }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['medical', 'records', 'delete', organizationId, animalId],
    mutationFn: ({ recordId }) => medicalRecordsApi.remove(organizationId, animalId, recordId),
    onSuccess: (_data, { recordId }) => {
      qc.removeQueries({ queryKey: medicalKeys.record(animalId, recordId) });
      void qc.invalidateQueries({ queryKey: medicalKeys.records(animalId) });
    },
  });
}
