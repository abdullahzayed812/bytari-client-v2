import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';

import { petKeys, petsApi } from '../api';
import type { Pet, PetListFilter, PetListPage } from '../types';

export interface UsePetsParams {
  /** Server-side text search (backend `search` param). */
  search?: string;
  species?: PetListFilter['species'];
  /** Default `ACTIVE` — a Pet Owner's "My Pets" hides deactivated animals. */
  status?: PetListFilter['status'];
  pageSize?: number;
  enabled?: boolean;
}

/**
 * Paginated "My Pets" list. Owner-scoped by the backend (`GET /animals` only
 * ever returns the caller's own animals). Uses `useInfiniteQuery` so the list
 * screen can append pages and pull-to-refresh.
 */
export function usePets(params: UsePetsParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const status = params.status ?? 'ACTIVE';
  const search = params.search?.trim() || undefined;

  const query = useInfiniteQuery<
    PetListPage,
    unknown,
    InfiniteData<PetListPage>,
    ReturnType<typeof petKeys.list>,
    number
  >({
    queryKey: petKeys.list({ page: 0, pageSize, status, species: params.species, search }),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      petsApi.list({ page: pageParam, pageSize, status, species: params.species, search }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });

  const pets = useMemo<Pet[]>(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, pets, total };
}
