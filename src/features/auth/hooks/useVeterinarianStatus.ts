import { useMemo } from 'react';

import { useAuthStore } from '../store';
import type { VeterinarianStatus } from '../types';

/**
 * Veterinarian approval status foundation (§13). Read-only — this phase does NOT
 * implement the application submission flow (that endpoint lives under
 * `/veterinarians/*`, not `/auth/*`).
 */
export interface VeterinarianStatusInfo {
  status: VeterinarianStatus;
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
  /** `true` once the user has applied at least once (any state but NOT_APPLIED). */
  hasApplied: boolean;
}

export function useVeterinarianStatus(): VeterinarianStatusInfo {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);

  return useMemo<VeterinarianStatusInfo>(() => {
    const status: VeterinarianStatus =
      session?.veterinarian.status ?? user?.veterinarianStatus ?? 'NOT_APPLIED';
    return {
      status,
      isApproved: session?.veterinarian.approved ?? status === 'APPROVED',
      isPending: status === 'PENDING',
      isRejected: status === 'REJECTED',
      hasApplied: status !== 'NOT_APPLIED',
    };
  }, [session, user]);
}
