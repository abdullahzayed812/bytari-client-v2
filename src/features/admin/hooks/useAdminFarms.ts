import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { adminApi, adminKeys } from '../api';
import type {
  AdminFarmListItem,
  AdminFarmRenewalRequest,
  ApproveFarmRenewalInput,
  FarmSubscriptionStatus,
  OrganizationStatus,
  Paginated,
  SetFarmSubscriptionInput,
} from '../types';

export interface AdminFarmsParams {
  status?: OrganizationStatus;
  subscriptionStatus?: FarmSubscriptionStatus;
  pageSize?: number;
  enabled?: boolean;
}

/** `GET /admin/organizations/farms` — the Poultry Farms management list. */
export function useAdminFarms(params: AdminFarmsParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = { status: params.status, subscriptionStatus: params.subscriptionStatus };

  const query = useInfiniteQuery<
    Paginated<AdminFarmListItem>,
    ApiError,
    InfiniteData<Paginated<AdminFarmListItem>>,
    ReturnType<typeof adminKeys.farms.list>,
    number
  >({
    queryKey: adminKeys.farms.list(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => adminApi.listFarms({ page: pageParam, pageSize, ...filter }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });

  const farms = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, farms, total: query.data?.pages[0]?.meta.total ?? 0 };
}

/** A farm's subscription renewal requests — admin/supervisor review queue. */
export function useAdminFarmRenewals(organizationId: string, options: { enabled?: boolean } = {}) {
  const query = useQuery<AdminFarmRenewalRequest[], ApiError>({
    queryKey: adminKeys.farms.renewals(organizationId),
    queryFn: () => adminApi.listFarmRenewalRequests(organizationId),
    enabled: (options.enabled ?? true) && Boolean(organizationId),
    staleTime: 15_000,
  });
  const requests = useMemo(() => query.data ?? [], [query.data]);
  const pending = useMemo(() => requests.filter((r) => r.status === 'PENDING'), [requests]);
  return { ...query, requests, pending };
}

/** Admin/Supervisor sets a farm's subscription period directly. */
export function useSetFarmSubscriptionMutation(organizationId: string) {
  const qc = useQueryClient();
  return useMutation<{ updated: boolean }, ApiError, SetFarmSubscriptionInput>({
    mutationKey: ['admin', 'farms', organizationId, 'set-subscription'],
    mutationFn: (input) => adminApi.setFarmSubscription(organizationId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.organizations.detail(organizationId) });
      void qc.invalidateQueries({ queryKey: adminKeys.farms.lists() });
    },
  });
}

type RenewalDecisionInput =
  | { decision: 'approve'; startDate: string; endDate: string }
  | { decision: 'reject'; reason: string };

/** Admin/Supervisor approves (sets the new period) or rejects a renewal request. */
export function useFarmRenewalDecisionMutation(organizationId: string, requestId: string) {
  const qc = useQueryClient();
  return useMutation<AdminFarmRenewalRequest, ApiError, RenewalDecisionInput>({
    mutationKey: ['admin', 'farms', organizationId, 'renewals', requestId, 'decision'],
    mutationFn: (input) => {
      if (input.decision === 'approve') {
        const body: ApproveFarmRenewalInput = {
          startDate: input.startDate,
          endDate: input.endDate,
        };
        return adminApi.approveFarmRenewal(organizationId, requestId, body);
      }
      return adminApi.rejectFarmRenewal(organizationId, requestId, input.reason);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.farms.renewals(organizationId) });
      void qc.invalidateQueries({ queryKey: adminKeys.organizations.detail(organizationId) });
      void qc.invalidateQueries({ queryKey: adminKeys.farms.lists() });
    },
  });
}
