import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';

import { orgKeys, organizationsApi } from '../api';
import type { OrganizationFollower, Paginated } from '../types';

/**
 * Paginated followers of one organization (dashboard "Followers" page).
 * Requires the owner or `organization.broadcast.send` server-side.
 */
export function useOrganizationFollowers(
  organizationId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  const pageSize = AppConfig.defaultPageSize;
  const query = useInfiniteQuery<
    Paginated<OrganizationFollower>,
    unknown,
    InfiniteData<Paginated<OrganizationFollower>>,
    ReturnType<typeof orgKeys.followers>,
    number
  >({
    queryKey: orgKeys.followers(organizationId ?? 'unknown'),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      organizationsApi.listFollowers(organizationId as string, { page: pageParam, pageSize }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(organizationId) && (options.enabled ?? true),
    staleTime: 15_000,
  });

  const followers = useMemo<OrganizationFollower[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  return { ...query, followers };
}
