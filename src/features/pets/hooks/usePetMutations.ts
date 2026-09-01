import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { petKeys, petsApi } from '../api';
import type { CreatePetInput, Pet, UpdatePetInput } from '../types';

/** Create a pet. On success: refetch the lists only (§14 — no global invalidation). */
export function useCreatePet(): UseMutationResult<Pet, unknown, CreatePetInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['pets', 'create'],
    mutationFn: (input: CreatePetInput) => petsApi.create(input),
    onSuccess: (pet) => {
      qc.setQueryData(petKeys.detail(pet.id), pet);
      void qc.invalidateQueries({ queryKey: petKeys.lists() });
    },
  });
}

/** Update a pet's profile fields. Never sends ownership/status. */
export function useUpdatePet(petId: string): UseMutationResult<Pet, unknown, UpdatePetInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['pets', 'update', petId],
    mutationFn: (input: UpdatePetInput) => petsApi.update(petId, input),
    onSuccess: (pet) => {
      qc.setQueryData(petKeys.detail(petId), pet);
      void qc.invalidateQueries({ queryKey: petKeys.lists() });
    },
  });
}

/** Soft-deactivate a pet (backend `DELETE /animals/:id`). */
export function useDeactivatePet(petId: string): UseMutationResult<Pet, unknown, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['pets', 'deactivate', petId],
    mutationFn: () => petsApi.deactivate(petId),
    onSuccess: (pet) => {
      qc.setQueryData(petKeys.detail(petId), pet);
      void qc.invalidateQueries({ queryKey: petKeys.lists() });
    },
  });
}
