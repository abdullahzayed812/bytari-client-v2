import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { poultryApi, poultryKeys } from '../api';
import type { Paginated, PoultryFlock, PoultryFlockStatus, PoultryBirdType } from '../types';

export interface UsePoultryFlocksParams {
  status?: PoultryFlockStatus;
  birdType?: PoultryBirdType;
  pageSize?: number;
  enabled?: boolean;
}

/**
 * A FARM's poultry flocks. Requires `farm.poultry.read` server-side. Paginated
 * (`page`/`pageSize`) with optional `status` / `birdType` filters.
 */
export function usePoultryFlocks(
  organizationId: string | undefined,
  params: UsePoultryFlocksParams = {},
) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = { status: params.status, birdType: params.birdType, pageSize };

  const query = useInfiniteQuery<
    Paginated<PoultryFlock>,
    unknown,
    InfiniteData<Paginated<PoultryFlock>>,
    ReturnType<typeof poultryKeys.list>,
    number
  >({
    queryKey: poultryKeys.list(organizationId ?? 'unknown', filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      poultryApi.list(organizationId as string, {
        page: pageParam,
        pageSize,
        status: params.status,
        birdType: params.birdType,
      }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(organizationId) && (params.enabled ?? true),
    staleTime: 15_000,
  });

  const flocks = useMemo<PoultryFlock[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, flocks, total };
}

/** One poultry flock. A flock id not under this farm returns `404` (cross-farm isolation). */
export function usePoultryFlock(
  organizationId: string | undefined,
  flockId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<PoultryFlock, ApiError>({
    queryKey: poultryKeys.detail(organizationId ?? 'unknown', flockId ?? 'unknown'),
    queryFn: () => poultryApi.get(organizationId as string, flockId as string),
    enabled: Boolean(organizationId) && Boolean(flockId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}
