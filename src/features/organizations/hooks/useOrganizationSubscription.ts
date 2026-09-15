import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CreateRenewalRequestInput, FarmSubscriptionRenewalRequest } from '@/features/farm/types';
import { ApiError } from '@/services/api';

import { organizationSubscriptionApi } from '../api/organizationSubscriptionApi';
import { orgKeys } from '../api/queryKeys';

function noRetryOn403(count: number, error: unknown): boolean {
  return !(error instanceof ApiError && error.status === 403) && count < 2;
}

/**
 * VETERINARY_OFFICE / CLINIC subscription renewal requests — the generalized
 * counterpart of `useFarmSubscriptionRenewals` (`@/features/farmShared/hooks`).
 */
export function useOrganizationSubscriptionRenewals(
  orgId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  const query = useQuery<{ items: FarmSubscriptionRenewalRequest[] }, ApiError>({
    queryKey: orgKeys.subscriptionRenewals(orgId ?? 'unknown'),
    queryFn: () => organizationSubscriptionApi.listRenewalRequests(orgId as string, 1, 20),
    enabled: Boolean(orgId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
  const requests = useMemo(() => query.data?.items ?? [], [query.data]);
  const hasPendingRenewal = useMemo(() => requests.some((r) => r.status === 'PENDING'), [requests]);
  return { ...query, requests, hasPendingRenewal };
}

export function useRequestOrganizationRenewal(orgId: string) {
  const qc = useQueryClient();
  return useMutation<FarmSubscriptionRenewalRequest, ApiError, CreateRenewalRequestInput>({
    mutationKey: ['organizations', orgId, 'subscription-renewal', 'create'],
    mutationFn: (input) => organizationSubscriptionApi.requestRenewal(orgId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orgKeys.subscriptionRenewals(orgId) });
    },
  });
}
