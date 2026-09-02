import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { tipKeys, tipsApi } from '../api';
import type { Tip, TipListItem, TipListPage, TipPriority } from '../types';

export interface UseTipsParams {
  search?: string;
  categoryId?: string;
  priority?: TipPriority;
  bookmarked?: boolean;
  pageSize?: number;
  enabled?: boolean;
}

/** Paginated "أهم النصائح" list. PUBLISHED tips only (backend-enforced). */
export function useTips(params: UseTipsParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const search = params.search?.trim() || undefined;

  const query = useInfiniteQuery<
    TipListPage,
    unknown,
    InfiniteData<TipListPage>,
    ReturnType<typeof tipKeys.list>,
    number
  >({
    queryKey: tipKeys.list({
      page: 0,
      pageSize,
      search,
      categoryId: params.categoryId,
      priority: params.priority,
      bookmarked: params.bookmarked,
    }),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      tipsApi.list({
        page: pageParam,
        pageSize,
        search,
        categoryId: params.categoryId,
        priority: params.priority,
        bookmarked: params.bookmarked,
      }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });

  const tips = useMemo<TipListItem[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, tips, total };
}

/** The featured "نصيحة اليوم" (or `null`). */
export function useTipOfTheDay(options: { enabled?: boolean } = {}) {
  return useQuery<Tip | null>({
    queryKey: tipKeys.tipOfDay(),
    queryFn: tipsApi.tipOfTheDay,
    enabled: options.enabled ?? true,
    staleTime: 60_000,
  });
}

/** One tip's full detail. `404` for a non-published / missing tip. */
export function useTip(tipId: string | undefined, options: { enabled?: boolean } = {}) {
  return useQuery<Tip, ApiError>({
    queryKey: tipKeys.detail(tipId ?? 'unknown'),
    queryFn: () => tipsApi.get(tipId as string),
    enabled: Boolean(tipId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}
