import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { useAuth } from '@/features/auth';
import {
  veterinarianApi,
  vetKeys,
  type ApplyForVeterinarianInput,
  type VeterinarianApplication,
} from '@/features/veterinarian';

/**
 * Submits the veterinarian application built by `VeterinarianRegisterScreen`
 * (called right after `register()` succeeds — the account already exists and
 * the session is already established at this point). Kept separate from
 * `useApplyForVeterinarian` (the in-app re-apply flow) because it is invoked
 * from an unauthenticated-turned-just-authenticated screen with its own retry
 * semantics (register never re-runs; only this mutation is retried on failure).
 */
export function useSubmitVeterinarianApplication(): UseMutationResult<
  VeterinarianApplication,
  unknown,
  ApplyForVeterinarianInput
> {
  const qc = useQueryClient();
  const { refreshSession } = useAuth();
  return useMutation({
    mutationKey: ['registration', 'veterinarian-apply'],
    mutationFn: (input: ApplyForVeterinarianInput) => veterinarianApi.apply(input),
    onSuccess: async () => {
      void qc.invalidateQueries({ queryKey: vetKeys.status() });
      await refreshSession();
    },
  });
}
