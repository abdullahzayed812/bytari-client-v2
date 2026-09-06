import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { CreateRenewalRequestInput, FarmSubscriptionRenewalRequest } from '@/features/farm/types';
import { ApiError } from '@/services/api';

import { farmKeys, farmSubscriptionApi } from '../api';

const noRetryOn403 = (count: number, error: unknown): boolean =>
  !(error instanceof ApiError && (error.status === 403 || error.status === 404)) && count < 2;

/**
 * A farm's own subscription renewal requests — used to show "renewal under
 * review" vs "request renewal" on the {@link FarmStatusCard}, and to back the
 * renewal-request screen's own history.
 */
export function useFarmSubscriptionRenewals(
  orgId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  const query = useQuery<{ items: FarmSubscriptionRenewalRequest[] }, ApiError>({
    queryKey: farmKeys.subscriptionRenewals(orgId ?? 'unknown'),
    queryFn: () => farmSubscriptionApi.listRenewalRequests(orgId as string, 1, 20),
    enabled: Boolean(orgId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
  const requests = useMemo(() => query.data?.items ?? [], [query.data]);
  const hasPendingRenewal = useMemo(
    () => requests.some((r) => r.status === 'PENDING'),
    [requests],
  );
  return { ...query, requests, hasPendingRenewal };
}

export function useRequestFarmRenewal(orgId: string) {
  const qc = useQueryClient();
  return useMutation<FarmSubscriptionRenewalRequest, ApiError, CreateRenewalRequestInput>({
    mutationKey: ['farm', orgId, 'subscription-renewal', 'create'],
    mutationFn: (input) => farmSubscriptionApi.requestRenewal(orgId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: farmKeys.subscriptionRenewals(orgId) });
    },
  });
}
