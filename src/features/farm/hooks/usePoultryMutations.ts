import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { poultryApi, poultryKeys } from '../api';
import type { CreatePoultryFlockInput, PoultryFlock, UpdatePoultryFlockInput } from '../types';

/**
 * Poultry-flock mutations, always scoped to one FARM. `createdByUserId` /
 * `organizationId` come from the route / JWT — never a body. No optimistic
 * updates: mutate → server success → invalidate (§28).
 */

export function useCreatePoultryFlock(
  organizationId: string,
): UseMutationResult<PoultryFlock, unknown, CreatePoultryFlockInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['poultry', 'create', organizationId],
    mutationFn: (body: CreatePoultryFlockInput) => poultryApi.create(organizationId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: poultryKeys.forOrg(organizationId) });
    },
  });
}

export function useUpdatePoultryFlock(
  organizationId: string,
): UseMutationResult<PoultryFlock, unknown, { flockId: string; body: UpdatePoultryFlockInput }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['poultry', 'update', organizationId],
    mutationFn: ({ flockId, body }) => poultryApi.update(organizationId, flockId, body),
    onSuccess: (_data, { flockId }) => {
      void qc.invalidateQueries({ queryKey: poultryKeys.detail(organizationId, flockId) });
      void qc.invalidateQueries({ queryKey: poultryKeys.forOrg(organizationId) });
    },
  });
}

export function useDeletePoultryFlock(
  organizationId: string,
): UseMutationResult<{ deleted: boolean }, unknown, { flockId: string }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['poultry', 'delete', organizationId],
    mutationFn: ({ flockId }) => poultryApi.remove(organizationId, flockId),
    onSuccess: (_data, { flockId }) => {
      qc.removeQueries({ queryKey: poultryKeys.detail(organizationId, flockId) });
      void qc.invalidateQueries({ queryKey: poultryKeys.forOrg(organizationId) });
    },
  });
}
