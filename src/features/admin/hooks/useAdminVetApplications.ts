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
import type { Paginated, PendingVetApplication } from '../types';

export function useAdminVetApplications(params: { pageSize?: number; enabled?: boolean } = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;

  const query = useInfiniteQuery<
    Paginated<PendingVetApplication>,
    ApiError,
    InfiniteData<Paginated<PendingVetApplication>>,
    ReturnType<typeof adminKeys.vetApplications.list>,
    number
  >({
    queryKey: adminKeys.vetApplications.list(),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => adminApi.listPendingVetApplications(pageParam, pageSize),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });

  const applications = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, applications, total: query.data?.pages[0]?.meta.total ?? 0 };
}

export function useVetDecisionMutation(): UseMutationResult<
  unknown,
  unknown,
  | { userId: string; decision: 'approve'; reason?: undefined }
  | { userId: string; decision: 'reject'; reason: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'vet-applications', 'decision'],
    mutationFn: (input) =>
      input.decision === 'approve'
        ? adminApi.approveVetApplication(input.userId)
        : adminApi.rejectVetApplication(input.userId, input.reason),
    onSuccess: (_data, input) => {
      void qc.invalidateQueries({ queryKey: adminKeys.vetApplications.all });
      void qc.invalidateQueries({ queryKey: adminKeys.users.detail(input.userId) });
      void qc.invalidateQueries({ queryKey: adminKeys.users.lists() });
    },
  });
}
