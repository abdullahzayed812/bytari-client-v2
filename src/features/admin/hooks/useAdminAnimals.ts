import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';

import { adminApi, adminKeys } from '../api';
import type { AdminAnimal, AdminAnimalStatus, Paginated } from '../types';

export interface AdminAnimalsParams {
  status?: AdminAnimalStatus;
  species?: string;
  search?: string;
  ownerUserId?: string;
}

/**
 * `/admin/animals` — every user's pets (oversight). `animal.read` (ADMIN or
 * ANIMAL supervisor). Rows carry the current owner's name.
 */
export function useAdminAnimals(params: AdminAnimalsParams = {}) {
  const pageSize = AppConfig.defaultPageSize;
  const filter = {
    status: params.status,
    species: params.species,
    search: params.search || undefined,
    ownerUserId: params.ownerUserId,
  };

  const query = useInfiniteQuery<
    Paginated<AdminAnimal>,
    unknown,
    InfiniteData<Paginated<AdminAnimal>>,
    ReturnType<typeof adminKeys.animals.list>,
    number
  >({
    queryKey: adminKeys.animals.list(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => adminApi.listAnimals({ ...filter, page: pageParam, pageSize }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 10_000,
  });

  const animals = useMemo<AdminAnimal[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;
  return { ...query, animals, total };
}

/** Soft-delete (deactivate) a user's pet — `animal.delete` (ADMIN override). */
export function useAdminDeleteAnimal(): UseMutationResult<
  { id: string; status: string },
  unknown,
  { animalId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['admin', 'animals', 'delete'],
    mutationFn: ({ animalId }) => adminApi.deleteAnimal(animalId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.animals.all });
    },
  });
}
