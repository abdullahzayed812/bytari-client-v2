import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';

import { orgKeys, organizationsApi } from '../api';
import type {
  DiscoverFilters,
  DiscoverSort,
  OrganizationType,
  Paginated,
  PublicOrganization,
} from '../types';

/** Round for the query key so GPS jitter between reads doesn't fragment the cache. */
const roundCoord = (n: number): number => Math.round(n * 10_000) / 10_000;

/**
 * Public organization discovery — ACTIVE organizations, any authenticated
 * user (not just members). Backs the Pet Owner Home "Available clinics"
 * section and `ClinicsScreen` (features/clinics), as scoped by `GET /organizations/discover`.
 *
 * `sort: 'nearest'` requires `near` (both `lat` and `lng`) — the backend
 * computes and orders by real great-circle distance; this hook never
 * estimates or sorts distance on the client.
 */
export function useDiscoverOrganizations(
  params: {
    type?: OrganizationType;
    search?: string;
    sort?: DiscoverSort;
    near?: { lat: number; lng: number };
    filters?: DiscoverFilters;
    pageSize?: number;
    enabled?: boolean;
  } = {},
) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const near = params.near
    ? { lat: roundCoord(params.near.lat), lng: roundCoord(params.near.lng) }
    : undefined;
  const filter = {
    type: params.type,
    search: params.search,
    sort: params.sort,
    near,
    country: params.filters?.country,
    minRating: params.filters?.minRating,
    service: params.filters?.service,
  };

  const query = useInfiniteQuery<
    Paginated<PublicOrganization>,
    unknown,
    InfiniteData<Paginated<PublicOrganization>>,
    ReturnType<typeof orgKeys.discoverList>,
    number
  >({
    queryKey: orgKeys.discoverList(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      organizationsApi.discover({
        page: pageParam,
        pageSize,
        type: params.type,
        search: params.search,
        sort: params.sort,
        near: params.near,
        country: filter.country,
        minRating: filter.minRating,
        service: filter.service,
      }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: (params.enabled ?? true) && (params.sort !== 'nearest' || Boolean(params.near)),
    staleTime: 30_000,
  });

  const organizations = useMemo<PublicOrganization[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, organizations, total };
}
