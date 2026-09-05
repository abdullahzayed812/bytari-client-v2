import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { newsApi, newsKeys } from '../api';
import type { News, NewsListItem, NewsListPage, NewsTag } from '../types';

export interface UseNewsParams {
  search?: string;
  categoryId?: string;
  tag?: NewsTag;
  bookmarked?: boolean;
  pageSize?: number;
  enabled?: boolean;
}

/** Paginated "أحدث الأخبار" list. PUBLISHED news only (backend-enforced). */
export function useNews(params: UseNewsParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const search = params.search?.trim() || undefined;

  const query = useInfiniteQuery<
    NewsListPage,
    unknown,
    InfiniteData<NewsListPage>,
    ReturnType<typeof newsKeys.list>,
    number
  >({
    queryKey: newsKeys.list({
      page: 0,
      pageSize,
      search,
      categoryId: params.categoryId,
      tag: params.tag,
      bookmarked: params.bookmarked,
    }),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      newsApi.list({
        page: pageParam,
        pageSize,
        search,
        categoryId: params.categoryId,
        tag: params.tag,
        bookmarked: params.bookmarked,
      }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });

  const news = useMemo<NewsListItem[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, news, total };
}

/** The featured "خبر مميز" hero (or `null`). */
export function useFeaturedNews(options: { enabled?: boolean } = {}) {
  return useQuery<News | null>({
    queryKey: newsKeys.featured(),
    queryFn: newsApi.featured,
    enabled: options.enabled ?? true,
    staleTime: 60_000,
  });
}

/** One news item's full detail. `404` for a non-published / missing item. */
export function useNewsItem(newsId: string | undefined, options: { enabled?: boolean } = {}) {
  return useQuery<News, ApiError>({
    queryKey: newsKeys.detail(newsId ?? 'unknown'),
    queryFn: () => newsApi.get(newsId as string),
    enabled: Boolean(newsId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}
