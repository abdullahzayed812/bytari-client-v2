import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';

import { orgAnimalKeys, organizationAnimalsApi } from '../api';
import type { OrganizationAnimalGrant, Paginated } from '../types';

/**
 * The animals a CLINIC organization has ACTIVE veterinary access to, as scoped
 * by the backend `GET /organizations/:organizationId/animal-access`. Paginated
 * so the list screen can append pages + pull-to-refresh. Requires
 * `animal.veterinary.access.read` server-side; a caller without it never
 * reaches the screen and a direct hit 403s.
 */
export function useOrganizationAnimals(
  organizationId: string | undefined,
  params: { pageSize?: number; enabled?: boolean } = {},
) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;

  const query = useInfiniteQuery<
    Paginated<OrganizationAnimalGrant>,
    unknown,
    InfiniteData<Paginated<OrganizationAnimalGrant>>,
    ReturnType<typeof orgAnimalKeys.list>,
    number
  >({
    queryKey: orgAnimalKeys.list(organizationId ?? 'unknown'),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      organizationAnimalsApi.list(organizationId as string, pageParam, pageSize),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(organizationId) && (params.enabled ?? true),
    staleTime: 15_000,
  });

  const animals = useMemo<OrganizationAnimalGrant[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, animals, total };
}
