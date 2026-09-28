import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { poultryMarketApi, poultryMarketKeys } from '@/features/poultryMarket';
import type { Paginated, TraderApplicationSummary, TraderStatus } from '@/features/poultryMarket';

/** Trader registration applications — admin/moderator oversight (`trader.admin.*`). */
export function useAdminTraderApplications(
  params: { status?: TraderStatus; pageSize?: number; enabled?: boolean } = {},
) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;

  const query = useInfiniteQuery<
    Paginated<TraderApplicationSummary>,
    unknown,
    InfiniteData<Paginated<TraderApplicationSummary>>,
    ReturnType<typeof poultryMarketKeys.traderAdminList>,
    number
  >({
    queryKey: poultryMarketKeys.traderAdminList(params.status),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      poultryMarketApi.traders.adminList(params.status, pageParam, pageSize),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });

  const applications = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, applications, total: query.data?.pages[0]?.meta.total ?? 0 };
}

type TraderDecisionInput =
  | { userId: string; decision: 'approve' }
  | { userId: string; decision: 'reject'; reason: string }
  | { userId: string; decision: 'suspend'; reason?: string }
  | { userId: string; decision: 'reactivate' }
  | { userId: string; decision: 'remove' }
  | {
      userId: string;
      decision: 'update';
      input: { displayName?: string; governorate?: string; phone?: string };
    };

export function useTraderDecisionMutation(): UseMutationResult<
  unknown,
  unknown,
  TraderDecisionInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'trader-applications', 'decision'],
    mutationFn: (input: TraderDecisionInput): Promise<unknown> => {
      if (input.decision === 'approve') return poultryMarketApi.traders.approve(input.userId);
      if (input.decision === 'reject')
        return poultryMarketApi.traders.reject(input.userId, input.reason);
      if (input.decision === 'suspend')
        return poultryMarketApi.traders.suspend(input.userId, input.reason);
      if (input.decision === 'remove') return poultryMarketApi.traders.adminRemove(input.userId);
      if (input.decision === 'update')
        return poultryMarketApi.traders.adminUpdate(input.userId, input.input);
      return poultryMarketApi.traders.reactivate(input.userId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['market', 'trader'] });
    },
  });
}
