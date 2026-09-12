import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { veterinarianStoreService, vetStoreKeys } from '../api';
import type {
  ListVetStoreProductsParams,
  Paginated,
  VetStoreCategory,
  VetStoreProductDetail,
  VetStoreProductListItem,
} from '../types';

/** Store categories (filter chips + home "shop by animal" tiles). */
export function useVeterinarianStoreCategories(
  options: { homeOnly?: boolean; enabled?: boolean } = {},
) {
  const homeOnly = options.homeOnly ?? false;
  return useQuery<VetStoreCategory[]>({
    queryKey: vetStoreKeys.categories(homeOnly),
    queryFn: () => veterinarianStoreService.listCategories(homeOnly),
    staleTime: 60_000,
    enabled: options.enabled ?? true,
  });
}

/** Paginated consumer product catalogue with search + category filter + sort. */
export function useVeterinarianStoreProducts(params: ListVetStoreProductsParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter: ListVetStoreProductsParams = {
    categoryId: params.categoryId || undefined,
    search: params.search || undefined,
    sort: params.sort,
    order: params.order,
    pageSize,
  };

  const query = useInfiniteQuery<
    Paginated<VetStoreProductListItem>,
    unknown,
    InfiniteData<Paginated<VetStoreProductListItem>>,
    ReturnType<typeof vetStoreKeys.productList>,
    number
  >({
    queryKey: vetStoreKeys.productList(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      veterinarianStoreService.listProducts({ ...filter, page: pageParam, pageSize }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 15_000,
  });

  const products = useMemo<VetStoreProductListItem[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, products, total };
}

/** One product's detail (ACTIVE only — a hidden product 404s). */
export function useVeterinarianStoreProduct(productId: string | undefined) {
  return useQuery<VetStoreProductDetail, ApiError>({
    queryKey: vetStoreKeys.product(productId ?? 'unknown'),
    queryFn: () => veterinarianStoreService.getProduct(productId as string),
    enabled: Boolean(productId),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });
}
