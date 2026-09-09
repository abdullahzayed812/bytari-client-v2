import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { publicationKeys, publicationsApi } from '../api';
import type {
  AnimalPublication,
  MyPublication,
  Paginated,
  PublicPublication,
  PublicationKind,
  PublicationStatus,
} from '../types';

/**
 * The authenticated public browse for one kind — APPROVED publications from
 * ALL users, never scoped to the caller (this is a directory, not "my
 * listings"). `search` matches the animal's name.
 */
export function usePublicPublications(
  kind: PublicationKind | null | undefined,
  params: { species?: string; search?: string; pageSize?: number; enabled?: boolean } = {},
) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = { species: params.species, search: params.search };

  const query = useInfiniteQuery<
    Paginated<PublicPublication>,
    unknown,
    InfiniteData<Paginated<PublicPublication>>,
    ReturnType<typeof publicationKeys.publicList>,
    number
  >({
    queryKey: publicationKeys.publicList((kind ?? 'ADOPTION') as PublicationKind, filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      publicationsApi.listPublic(pageParam, pageSize, { kind: kind as PublicationKind, ...filter }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(kind) && (params.enabled ?? true),
    staleTime: 15_000,
  });

  const publications = useMemo<PublicPublication[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, publications, total };
}

/**
 * "My listings" for one kind — the caller's OWN publications of every status
 * (PENDING / APPROVED / REJECTED). The backend derives ownership from the
 * session; this is never a client-supplied user id.
 */
export function useMyPublications(
  kind: PublicationKind | null | undefined,
  params: { status?: PublicationStatus; pageSize?: number; enabled?: boolean } = {},
) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;

  const query = useInfiniteQuery<
    Paginated<MyPublication>,
    unknown,
    InfiniteData<Paginated<MyPublication>>,
    ReturnType<typeof publicationKeys.mineList>,
    number
  >({
    queryKey: publicationKeys.mineList((kind ?? 'ADOPTION') as PublicationKind, {
      status: params.status,
    }),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      publicationsApi.listMine(pageParam, pageSize, {
        kind: kind as PublicationKind,
        status: params.status,
      }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(kind) && (params.enabled ?? true),
    staleTime: 10_000,
  });

  const publications = useMemo<MyPublication[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, publications, total };
}

/** One APPROVED publication (public detail). `404` for anything non-approved. */
export function usePublicPublication(
  publicationId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<PublicPublication, ApiError>({
    queryKey: publicationKeys.publicDetail(publicationId ?? 'unknown'),
    queryFn: () => publicationsApi.getPublic(publicationId as string),
    enabled: Boolean(publicationId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}

/**
 * One animal's own publications (every status — "My Listings"). Requires the
 * caller to be the animal's current owner (or ADMIN / ANIMAL supervisor) — a
 * non-owner hits `404`.
 */
export function useAnimalPublications(
  animalId: string | undefined,
  params: { pageSize?: number; enabled?: boolean } = {},
) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;

  const query = useInfiniteQuery<
    Paginated<AnimalPublication>,
    unknown,
    InfiniteData<Paginated<AnimalPublication>>,
    ReturnType<typeof publicationKeys.animalList>,
    number
  >({
    queryKey: publicationKeys.animalList(animalId ?? 'unknown'),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      publicationsApi.listForAnimal(animalId as string, pageParam, pageSize),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(animalId) && (params.enabled ?? true),
    staleTime: 15_000,
  });

  const publications = useMemo<AnimalPublication[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, publications, total };
}

/** One of an animal's own publications — the owner view, with status + rejection reason. */
export function useAnimalPublication(
  animalId: string | undefined,
  publicationId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<AnimalPublication, ApiError>({
    queryKey: publicationKeys.animalDetail(animalId ?? 'unknown', publicationId ?? 'unknown'),
    queryFn: () => publicationsApi.getForAnimal(animalId as string, publicationId as string),
    enabled: Boolean(animalId) && Boolean(publicationId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}
