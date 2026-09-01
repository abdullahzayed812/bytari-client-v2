import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';

import { orgKeys, organizationsApi } from '../api';
import type { MyOrganization, Paginated } from '../types';

/**
 * "My Organizations" — every organization the signed-in user is an ACTIVE
 * member of (any role), newest membership first, as scoped by the backend
 * `GET /organizations`. Paginated so the list screen can append + pull-to-refresh.
 */
export function useOrganizations(params: { pageSize?: number; enabled?: boolean } = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;

  const query = useInfiniteQuery<
    Paginated<MyOrganization>,
    unknown,
    InfiniteData<Paginated<MyOrganization>>,
    ReturnType<typeof orgKeys.list>,
    number
  >({
    queryKey: orgKeys.list(0),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => organizationsApi.listMine(pageParam, pageSize),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });

  const organizations = useMemo<MyOrganization[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, organizations, total };
}
