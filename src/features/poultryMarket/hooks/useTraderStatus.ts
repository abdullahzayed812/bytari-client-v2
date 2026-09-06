import { useMemo } from 'react';

import { useAuthStore } from '@/features/auth/store';
import type { TraderStatus } from '@/features/auth/types';

/**
 * Trader approval status foundation (Poultry Markets module). Read-only,
 * derived from the session snapshot — mirrors `useVeterinarianStatus` exactly.
 * The registration submission flow lives under `/traders/*`, not `/auth/*`.
 */
export interface TraderStatusInfo {
  status: TraderStatus;
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
  isSuspended: boolean;
  /** `true` once the user has registered at least once (any state but NOT_REGISTERED). */
  hasRegistered: boolean;
}

export function useTraderStatus(): TraderStatusInfo {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);

  return useMemo<TraderStatusInfo>(() => {
    const status: TraderStatus =
      session?.trader.status ?? user?.traderStatus ?? 'NOT_REGISTERED';
    return {
      status,
      isApproved: session?.trader.approved ?? status === 'APPROVED',
      isPending: status === 'PENDING',
      isRejected: status === 'REJECTED',
      isSuspended: status === 'SUSPENDED',
      hasRegistered: status !== 'NOT_REGISTERED',
    };
  }, [session, user]);
}
