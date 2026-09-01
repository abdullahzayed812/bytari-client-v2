import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { contentApi, contentKeys } from '../api';
import type {
  ContentCategory,
  ContentDownload,
  ContentItem,
  ContentType,
  Paginated,
} from '../types';

export interface UseContentListParams {
  type?: ContentType;
  categoryId?: string;
  search?: string;
  pageSize?: number;
  enabled?: boolean;
}

/**
 * Published content, paginated (`page`/`pageSize`) with the backend's own
 * `type` / `categoryId` / `q` filters (§14/§15). The filter set is part of the
 * query key so Articles / Books / search results never share a cache entry.
 * There is no `sort` param on the backend, so none is exposed (§16).
 */
export function useContentList(params: UseContentListParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = {
    type: params.type,
    categoryId: params.categoryId,
    search: params.search || undefined,
    pageSize,
  };

  const query = useInfiniteQuery<
    Paginated<ContentItem>,
    unknown,
    InfiniteData<Paginated<ContentItem>>,
    ReturnType<typeof contentKeys.list>,
    number
  >({
    queryKey: contentKeys.list(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      contentApi.list({
        page: pageParam,
        pageSize,
        type: params.type,
        categoryId: params.categoryId,
        search: params.search || undefined,
      }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });

  const items = useMemo<ContentItem[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, items, total };
}

/** One published content item. A DRAFT / ARCHIVED / deleted / unknown id → `404`. */
export function useContentItem(contentId: string | undefined, options: { enabled?: boolean } = {}) {
  return useQuery<ContentItem, ApiError>({
    queryKey: contentKeys.detail(contentId ?? 'unknown'),
    queryFn: () => contentApi.get(contentId as string),
    enabled: Boolean(contentId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}

/** The category list for filter UIs (`GET /content-categories`). */
export function useContentCategories(options: { enabled?: boolean } = {}) {
  return useQuery<ContentCategory[], ApiError>({
    queryKey: contentKeys.categories(),
    queryFn: () => contentApi.listCategories(),
    enabled: options.enabled ?? true,
    staleTime: 5 * 60_000,
  });
}

/**
 * A backend-authorized download URL for one content file. Fetched lazily (the
 * reader screen enables it) so a list never triggers N download-URL calls. The
 * URL may be a stable public CDN URL or a ~5-minute signed URL — not cached
 * long (§21/§35): `staleTime: 0`, `gcTime` short.
 */
export function useContentFileUrl(
  contentId: string | undefined,
  fileId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<ContentDownload, ApiError>({
    queryKey: contentKeys.file(contentId ?? 'unknown', fileId ?? 'unknown'),
    queryFn: () => contentApi.fileDownload(contentId as string, fileId as string),
    enabled: Boolean(contentId) && Boolean(fileId) && (options.enabled ?? true),
    staleTime: 0,
    gcTime: 60_000,
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}
