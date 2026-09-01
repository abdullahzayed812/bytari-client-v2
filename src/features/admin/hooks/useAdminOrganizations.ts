import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { adminApi, adminKeys } from '../api';
import type {
  AdminOrgMember,
  Organization,
  OrganizationStatus,
  OrganizationType,
  OrgStatusAction,
  Paginated,
} from '../types';

export interface AdminOrgsParams {
  pending?: boolean;
  type?: OrganizationType;
  status?: OrganizationStatus;
  search?: string;
  pageSize?: number;
  enabled?: boolean;
}

export function useAdminOrganizations(params: AdminOrgsParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = {
    pending: params.pending ?? false,
    type: params.type,
    status: params.status,
    search: params.search || undefined,
  };

  const query = useInfiniteQuery<
    Paginated<Organization>,
    ApiError,
    InfiniteData<Paginated<Organization>>,
    ReturnType<typeof adminKeys.organizations.list>,
    number
  >({
    queryKey: adminKeys.organizations.list(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      filter.pending
        ? adminApi.listPendingOrganizations(pageParam, pageSize)
        : adminApi.listOrganizations({
            page: pageParam,
            pageSize,
            type: filter.type,
            status: filter.status,
            search: filter.search,
          }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });

  const organizations = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  return { ...query, organizations, total: query.data?.pages[0]?.meta.total ?? 0 };
}

export function useAdminOrganization(organizationId: string, options: { enabled?: boolean } = {}) {
  return useQuery<Organization, ApiError>({
    queryKey: adminKeys.organizations.detail(organizationId),
    queryFn: () => adminApi.getOrganization(organizationId),
    enabled: (options.enabled ?? true) && Boolean(organizationId),
    staleTime: 15_000,
  });
}

export function useAdminOrganizationMembers(
  organizationId: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery<AdminOrgMember[], ApiError>({
    queryKey: adminKeys.organizations.members(organizationId),
    queryFn: () => adminApi.listOrganizationMembers(organizationId),
    enabled: (options.enabled ?? true) && Boolean(organizationId),
    staleTime: 15_000,
  });
}

type OrgDecisionInput =
  | { decision: 'approve' }
  | { decision: 'reject'; reason: string }
  | { decision: OrgStatusAction; reason?: string };

export function useOrgDecisionMutation(
  organizationId: string,
): UseMutationResult<Organization, unknown, OrgDecisionInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'organizations', organizationId, 'decision'],
    mutationFn: (input) => {
      if (input.decision === 'approve') return adminApi.approveOrganization(organizationId);
      if (input.decision === 'reject')
        return adminApi.rejectOrganization(organizationId, input.reason);
      return adminApi.changeOrganizationStatus(organizationId, input.decision, input.reason);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.organizations.detail(organizationId) });
      void qc.invalidateQueries({ queryKey: adminKeys.organizations.lists() });
    },
  });
}
