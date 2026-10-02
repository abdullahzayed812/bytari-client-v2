import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { poultryMarketApi, poultryMarketKeys } from '../api';
import type { RegisterTraderInput, TraderProfile, TraderStatusResult } from '../types';

/** My trader status + profile, straight from the backend (not just the session snapshot). */
export function useTraderStatusQuery(options: { enabled?: boolean } = {}) {
  return useQuery<TraderStatusResult>({
    queryKey: poultryMarketKeys.traderStatus,
    queryFn: () => poultryMarketApi.traders.me(),
    enabled: options.enabled ?? true,
    staleTime: 15_000,
  });
}

/**
 * Submit (or reapply for) trader registration. The caller is responsible for
 * calling `refreshSession()` afterward so the session-derived `useTraderStatus()`
 * reflects the new PENDING state without a re-login.
 */
export function useRegisterTrader(): UseMutationResult<
  TraderProfile,
  unknown,
  RegisterTraderInput
> {
  return useMutation({
    mutationKey: ['market', 'trader', 'register'],
    mutationFn: (input: RegisterTraderInput) => poultryMarketApi.traders.register(input),
  });
}

/** "طلب تجديد" — ask the admin to renew an expired trader activation period. */
export function useRequestTraderRenewal(): UseMutationResult<TraderProfile, unknown, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['market', 'trader', 'renewal'],
    mutationFn: () => poultryMarketApi.traders.requestRenewal(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: poultryMarketKeys.traderStatus }),
  });
}

/** Admin: set / renew a trader's activation period. */
export function useAdminSetTraderSubscription(): UseMutationResult<
  TraderProfile,
  unknown,
  { userId: string; startDate: string; endDate: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['market', 'trader', 'admin-subscription'],
    mutationFn: ({ userId, startDate, endDate }) =>
      poultryMarketApi.traders.adminSetSubscription(userId, { startDate, endDate }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['market'] }),
  });
}
