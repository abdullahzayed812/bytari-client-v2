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
  BirdType,
  CreatePoultryOfferInput,
  ListPoultryOffersFilter,
  Paginated,
  PoultryOffer,
} from '../types';

export interface UsePoultryOffersParams {
  birdType?: BirdType;
  governorate?: string;
  pageSize?: number;
  enabled?: boolean;
}

/** Public poultry-offer feed (ACTIVE only), any authenticated user. */
export function usePoultryOffers(params: UsePoultryOffersParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = { birdType: params.birdType, governorate: params.governorate, pageSize };

  const query = useInfiniteQuery<
    Paginated<PoultryOffer>,
    unknown,
    InfiniteData<Paginated<PoultryOffer>>,
    ReturnType<typeof poultryMarketKeys.poultryOffers.list>,
    number
  >({
    queryKey: poultryMarketKeys.poultryOffers.list(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      poultryMarketApi.poultryOffers.list({
        page: pageParam,
        pageSize,
        birdType: params.birdType,
        governorate: params.governorate,
      }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: params.enabled ?? true,
    staleTime: 15_000,
  });

  const offers = useMemo<PoultryOffer[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, offers, total };
}

/** My own poultry offers — requires an approved trader. */
export function useMyPoultryOffers(options: { pageSize?: number; enabled?: boolean } = {}) {
  const pageSize = options.pageSize ?? AppConfig.defaultPageSize;

  const query = useInfiniteQuery<
    Paginated<PoultryOffer>,
    unknown,
    InfiniteData<Paginated<PoultryOffer>>,
    typeof poultryMarketKeys.poultryOffers.mine,
    number
  >({
    queryKey: poultryMarketKeys.poultryOffers.mine,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => poultryMarketApi.poultryOffers.listMine(pageParam, pageSize),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: options.enabled ?? true,
  });

  const offers = useMemo<PoultryOffer[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  return { ...query, offers };
}

export function usePoultryOffer(offerId: string | undefined, options: { enabled?: boolean } = {}) {
  return useQuery<PoultryOffer, ApiError>({
    queryKey: poultryMarketKeys.poultryOffers.detail(offerId ?? 'unknown'),
    queryFn: () => poultryMarketApi.poultryOffers.get(offerId as string),
    enabled: Boolean(offerId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}

export function useCreatePoultryOffer(): UseMutationResult<
  PoultryOffer,
  unknown,
  CreatePoultryOfferInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['market', 'poultry-offers', 'create'],
    mutationFn: (input: CreatePoultryOfferInput) => poultryMarketApi.poultryOffers.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: poultryMarketKeys.poultryOffers.all });
    },
  });
}

export function useDeletePoultryOffer(): UseMutationResult<
  { success: boolean },
  unknown,
  { offerId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['market', 'poultry-offers', 'delete'],
    mutationFn: ({ offerId }) => poultryMarketApi.poultryOffers.remove(offerId),
    onSuccess: (_data, { offerId }) => {
      void qc.invalidateQueries({ queryKey: poultryMarketKeys.poultryOffers.detail(offerId) });
      void qc.invalidateQueries({ queryKey: poultryMarketKeys.poultryOffers.all });
    },
  });
}

export function useAdminPoultryOffers(filter: ListPoultryOffersFilter) {
  const query = useInfiniteQuery<
    Paginated<PoultryOffer>,
    unknown,
    InfiniteData<Paginated<PoultryOffer>>,
    ReturnType<typeof poultryMarketKeys.poultryOffers.adminList>,
    number
  >({
    queryKey: poultryMarketKeys.poultryOffers.adminList({
      birdType: filter.birdType,
      governorate: filter.governorate,
      status: filter.status,
      pageSize: filter.pageSize,
    }),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => poultryMarketApi.poultryOffers.adminList({ ...filter, page: pageParam }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });

  const offers = useMemo<PoultryOffer[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  return { ...query, offers };
}

export function useAdminDeletePoultryOffer(): UseMutationResult<
  { success: boolean },
  unknown,
  { offerId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['market', 'poultry-offers', 'admin-delete'],
    mutationFn: ({ offerId }) => poultryMarketApi.poultryOffers.adminRemove(offerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: poultryMarketKeys.poultryOffers.all });
    },
  });
}
