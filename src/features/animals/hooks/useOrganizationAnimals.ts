import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';

import { orgAnimalKeys, organizationAnimalsApi } from '../api';
import type { ClinicPet, Paginated } from '../types';

/**
 * The clinic's pets — those it created its own records for — newest activity
 * first (`GET /organizations/:organizationId/clinic-pets`). The first page is
 * "Recent Pets", paging through it is "All Pets". Requires
 * `animal.veterinary.access.read` server-side; a direct hit without it 403s.
 */
export function useOrganizationAnimals(
  organizationId: string | undefined,
  params: { pageSize?: number; enabled?: boolean } = {},
) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;

  const query = useInfiniteQuery<
    Paginated<ClinicPet>,
    unknown,
    InfiniteData<Paginated<ClinicPet>>,
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

  const animals = useMemo<ClinicPet[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, animals, total };
}
