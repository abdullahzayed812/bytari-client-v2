import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { poultryMarketApi, poultryMarketKeys } from '../api';
import type {
  CreateHatcheryOfferInput,
  HatcheryOffer,
  ChickType,
  ListHatcheryOffersFilter,
  Paginated,
} from '../types';

export interface UseHatcheryOffersParams {
  chickType?: ChickType;
  governorate?: string;
  pageSize?: number;
  enabled?: boolean;
}

/** Public hatchery-offer feed ("عروض المفاقس" — APPROVED + ACTIVE), Markets access. */
export function useHatcheryOffers(params: UseHatcheryOffersParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = { chickType: params.chickType, governorate: params.governorate, pageSize };

  const query = useInfiniteQuery<
    Paginated<HatcheryOffer>,
    unknown,
    InfiniteData<Paginated<HatcheryOffer>>,
    ReturnType<typeof poultryMarketKeys.hatcheryOffers.list>,
    number
  >({
    queryKey: poultryMarketKeys.hatcheryOffers.list(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      poultryMarketApi.hatcheryOffers.list({
        page: pageParam,
        pageSize,
        chickType: params.chickType,
        governorate: params.governorate,
      }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });

  const offers = useMemo<HatcheryOffer[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, offers, total };
}

/** My own hatchery offers (any moderation state) — eligible seller. */
export function useMyHatcheryOffers(options: { pageSize?: number; enabled?: boolean } = {}) {
  const pageSize = options.pageSize ?? AppConfig.defaultPageSize;

  const query = useInfiniteQuery<
    Paginated<HatcheryOffer>,
    unknown,
    InfiniteData<Paginated<HatcheryOffer>>,
    typeof poultryMarketKeys.hatcheryOffers.mine,
    number
  >({
    queryKey: poultryMarketKeys.hatcheryOffers.mine,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => poultryMarketApi.hatcheryOffers.listMine(pageParam, pageSize),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: options.enabled ?? true,
  });

  const offers = useMemo<HatcheryOffer[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  return { ...query, offers };
}

export function useHatcheryOffer(offerId: string | undefined, options: { enabled?: boolean } = {}) {
  return useQuery<HatcheryOffer, ApiError>({
    queryKey: poultryMarketKeys.hatcheryOffers.detail(offerId ?? 'unknown'),
    queryFn: () => poultryMarketApi.hatcheryOffers.get(offerId as string),
    enabled: Boolean(offerId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}

export function useCreateHatcheryOffer(): UseMutationResult<
  HatcheryOffer,
  unknown,
  CreateHatcheryOfferInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['market', 'hatchery-offers', 'create'],
    mutationFn: (input: CreateHatcheryOfferInput) => poultryMarketApi.hatcheryOffers.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: poultryMarketKeys.hatcheryOffers.all });
    },
  });
}

export function useDeleteHatcheryOffer(): UseMutationResult<
  { success: boolean },
  unknown,
  { offerId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['market', 'hatchery-offers', 'delete'],
    mutationFn: ({ offerId }) => poultryMarketApi.hatcheryOffers.remove(offerId),
    onSuccess: (_data, { offerId }) => {
      void qc.invalidateQueries({ queryKey: poultryMarketKeys.hatcheryOffers.detail(offerId) });
      void qc.invalidateQueries({ queryKey: poultryMarketKeys.hatcheryOffers.all });
    },
  });
}

export function useAdminHatcheryOffers(filter: ListHatcheryOffersFilter) {
  const query = useInfiniteQuery<
    Paginated<HatcheryOffer>,
    unknown,
    InfiniteData<Paginated<HatcheryOffer>>,
    ReturnType<typeof poultryMarketKeys.hatcheryOffers.adminList>,
    number
  >({
    queryKey: poultryMarketKeys.hatcheryOffers.adminList({
      chickType: filter.chickType,
      governorate: filter.governorate,
      status: filter.status,
      moderationStatus: filter.moderationStatus,
      search: filter.search,
      pageSize: filter.pageSize,
    }),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      poultryMarketApi.hatcheryOffers.adminList({ ...filter, page: pageParam }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });

  const offers = useMemo<HatcheryOffer[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  return { ...query, offers };
}

export function useAdminDeleteHatcheryOffer(): UseMutationResult<
  { success: boolean },
  unknown,
  { offerId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['market', 'hatchery-offers', 'admin-delete'],
    mutationFn: ({ offerId }) => poultryMarketApi.hatcheryOffers.adminRemove(offerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: poultryMarketKeys.hatcheryOffers.all });
    },
  });
}

/** Approve / reject a PENDING ad (`market.offer.admin.moderate`). */
export function useModerateHatcheryOffer(): UseMutationResult<
  unknown,
  unknown,
  { offerId: string; decision: 'approve' } | { offerId: string; decision: 'reject'; reason: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['market', 'hatcheryOffers', 'moderate'],
    mutationFn: (input) =>
      input.decision === 'approve'
        ? poultryMarketApi.hatcheryOffers.approve(input.offerId)
        : poultryMarketApi.hatcheryOffers.reject(input.offerId, input.reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: poultryMarketKeys.hatcheryOffers.all });
    },
  });
}
