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
  CreateEggOfferInput,
  EggOffer,
  EggType,
  ListEggOffersFilter,
  Paginated,
} from '../types';

export interface UseEggOffersParams {
  eggType?: EggType;
  governorate?: string;
  pageSize?: number;
  enabled?: boolean;
}

/** Public egg-offer feed (ACTIVE only), any authenticated user. */
export function useEggOffers(params: UseEggOffersParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = { eggType: params.eggType, governorate: params.governorate, pageSize };

  const query = useInfiniteQuery<
    Paginated<EggOffer>,
    unknown,
    InfiniteData<Paginated<EggOffer>>,
    ReturnType<typeof poultryMarketKeys.eggOffers.list>,
    number
  >({
    queryKey: poultryMarketKeys.eggOffers.list(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      poultryMarketApi.eggOffers.list({
        page: pageParam,
        pageSize,
        eggType: params.eggType,
        governorate: params.governorate,
      }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });

  const offers = useMemo<EggOffer[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, offers, total };
}

/** My own egg offers — requires an approved trader. */
export function useMyEggOffers(options: { pageSize?: number; enabled?: boolean } = {}) {
  const pageSize = options.pageSize ?? AppConfig.defaultPageSize;

  const query = useInfiniteQuery<
    Paginated<EggOffer>,
    unknown,
    InfiniteData<Paginated<EggOffer>>,
    typeof poultryMarketKeys.eggOffers.mine,
    number
  >({
    queryKey: poultryMarketKeys.eggOffers.mine,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => poultryMarketApi.eggOffers.listMine(pageParam, pageSize),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: options.enabled ?? true,
  });

  const offers = useMemo<EggOffer[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  return { ...query, offers };
}

export function useEggOffer(offerId: string | undefined, options: { enabled?: boolean } = {}) {
  return useQuery<EggOffer, ApiError>({
    queryKey: poultryMarketKeys.eggOffers.detail(offerId ?? 'unknown'),
    queryFn: () => poultryMarketApi.eggOffers.get(offerId as string),
    enabled: Boolean(offerId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}

export function useCreateEggOffer(): UseMutationResult<EggOffer, unknown, CreateEggOfferInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['market', 'egg-offers', 'create'],
    mutationFn: (input: CreateEggOfferInput) => poultryMarketApi.eggOffers.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: poultryMarketKeys.eggOffers.all });
    },
  });
}

export function useDeleteEggOffer(): UseMutationResult<
  { success: boolean },
  unknown,
  { offerId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['market', 'egg-offers', 'delete'],
    mutationFn: ({ offerId }) => poultryMarketApi.eggOffers.remove(offerId),
    onSuccess: (_data, { offerId }) => {
      void qc.invalidateQueries({ queryKey: poultryMarketKeys.eggOffers.detail(offerId) });
      void qc.invalidateQueries({ queryKey: poultryMarketKeys.eggOffers.all });
    },
  });
}

export function useAdminEggOffers(filter: ListEggOffersFilter) {
  const query = useInfiniteQuery<
    Paginated<EggOffer>,
    unknown,
    InfiniteData<Paginated<EggOffer>>,
    ReturnType<typeof poultryMarketKeys.eggOffers.adminList>,
    number
  >({
    queryKey: poultryMarketKeys.eggOffers.adminList({
      eggType: filter.eggType,
      governorate: filter.governorate,
      status: filter.status,
      pageSize: filter.pageSize,
    }),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => poultryMarketApi.eggOffers.adminList({ ...filter, page: pageParam }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });

  const offers = useMemo<EggOffer[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  return { ...query, offers };
}

export function useAdminDeleteEggOffer(): UseMutationResult<
  { success: boolean },
  unknown,
  { offerId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['market', 'egg-offers', 'admin-delete'],
    mutationFn: ({ offerId }) => poultryMarketApi.eggOffers.adminRemove(offerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: poultryMarketKeys.eggOffers.all });
    },
  });
}
