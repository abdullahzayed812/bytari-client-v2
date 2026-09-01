import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { adminApi, adminKeys } from '../api';
import type {
  AssignSupervisorInput,
  Paginated,
  SupervisorAssignment,
  SupervisorAssignmentStatus,
  SupervisorDomain,
} from '../types';

export function useAdminSupervisors(
  params: {
    domain?: SupervisorDomain;
    status?: SupervisorAssignmentStatus;
    pageSize?: number;
    enabled?: boolean;
  } = {},
) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = { domain: params.domain, status: params.status };

  const query = useInfiniteQuery<
    Paginated<SupervisorAssignment>,
    ApiError,
    InfiniteData<Paginated<SupervisorAssignment>>,
    ReturnType<typeof adminKeys.supervisors.list>,
    number
  >({
    queryKey: adminKeys.supervisors.list(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => adminApi.listSupervisors({ page: pageParam, pageSize, ...filter }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });

  const assignments = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, assignments, total: query.data?.pages[0]?.meta.total ?? 0 };
}

export function useAssignSupervisorMutation(): UseMutationResult<
  SupervisorAssignment,
  unknown,
  AssignSupervisorInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'supervisors', 'assign'],
    mutationFn: (input) => adminApi.assignSupervisor(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: adminKeys.supervisors.all }),
  });
}

export function useRemoveSupervisorMutation(): UseMutationResult<
  SupervisorAssignment,
  unknown,
  { assignmentId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'supervisors', 'remove'],
    mutationFn: ({ assignmentId }) => adminApi.removeSupervisor(assignmentId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: adminKeys.supervisors.all }),
  });
}
