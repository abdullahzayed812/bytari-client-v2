import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { useAuth } from '@/hooks';
import { ApiError } from '@/services/api';

import { veterinarianApi, vetKeys } from '../api';
import type {
  ApplyForVeterinarianInput,
  VeterinarianApplication,
  VeterinarianStatusResponse,
} from '../types';

/**
 * `GET /veterinarians/me/status` — the authoritative application record,
 * including the rejection reason (which the `/auth/me` snapshot does not carry).
 * The session snapshot stays the source of truth for the *status* itself.
 */
export function useVeterinarianApplicationStatus(options: { enabled?: boolean } = {}) {
  return useQuery<VeterinarianStatusResponse, ApiError>({
    queryKey: vetKeys.status(),
    queryFn: () => veterinarianApi.myStatus(),
    enabled: options.enabled ?? true,
    staleTime: 30_000,
  });
}

/**
 * Submit (or re-submit) a veterinarian application. The backend accepts this
 * only from `NOT_APPLIED` / `REJECTED` and 409s otherwise. On success we refresh
 * the `/auth/me` snapshot so `useCapabilities()` / `useAppMode()` immediately
 * reflect the new `PENDING` state.
 */
export function useApplyForVeterinarian(): UseMutationResult<
  VeterinarianApplication,
  unknown,
  ApplyForVeterinarianInput
> {
  const qc = useQueryClient();
  const { refreshSession } = useAuth();
  return useMutation({
    mutationKey: ['veterinarian', 'apply'],
    mutationFn: (input: ApplyForVeterinarianInput) => veterinarianApi.apply(input),
    onSuccess: async () => {
      void qc.invalidateQueries({ queryKey: vetKeys.status() });
      await refreshSession();
    },
  });
}
