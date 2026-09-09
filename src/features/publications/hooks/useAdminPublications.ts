import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { adminPublicationsApi, publicationKeys } from '../api';
import type { AnimalPublication, Paginated, PublicationKind, PublicationStatus } from '../types';

/**
 * The Lost / Adoption / Mating moderation queue — `GET /admin/animal-publications`.
 * `animal.read` (ADMIN or ANIMAL supervisor). Defaults to PENDING so the admin
 * sees the requests awaiting action first.
 */
export function useAdminAnimalPublications(
  filter: { kind?: PublicationKind; status?: PublicationStatus } = {},
) {
  const pageSize = AppConfig.defaultPageSize;
  const query = useInfiniteQuery<
    Paginated<AnimalPublication>,
    unknown,
    InfiniteData<Paginated<AnimalPublication>>,
    ReturnType<typeof publicationKeys.adminList>,
    number
  >({
    queryKey: publicationKeys.adminList({ kind: filter.kind, status: filter.status }),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => adminPublicationsApi.list(pageParam, pageSize, filter),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 10_000,
  });

  const publications = useMemo<AnimalPublication[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;
  return { ...query, publications, total };
}

function useModerate(
  fn: (id: string, reason?: string) => Promise<AnimalPublication>,
  key: string,
): UseMutationResult<AnimalPublication, ApiError, { publicationId: string; reason?: string }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['publications', 'admin', key],
    mutationFn: ({ publicationId, reason }) => fn(publicationId, reason),
    onSuccess: (updated) => {
      void qc.invalidateQueries({ queryKey: publicationKeys.admin() });
      void qc.invalidateQueries({ queryKey: publicationKeys.publicList(updated.kind) });
    },
  });
}

export function useAdminApprovePublication() {
  return useModerate((id) => adminPublicationsApi.approve(id), 'approve');
}

export function useAdminRejectPublication() {
  return useModerate((id, reason) => adminPublicationsApi.reject(id, reason ?? ''), 'reject');
}
