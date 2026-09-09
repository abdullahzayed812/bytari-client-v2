import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { petOwnerStoreService, petStoreKeys } from '../api';
import type {
  ListPetStoreProductsParams,
  Paginated,
  PetStoreCategory,
  PetStoreProductDetail,
  PetStoreProductListItem,
} from '../types';

/** Store categories (filter chips + home "shop by animal" tiles). */
export function usePetOwnerStoreCategories(
  options: { homeOnly?: boolean; enabled?: boolean } = {},
) {
  const homeOnly = options.homeOnly ?? false;
  return useQuery<PetStoreCategory[]>({
    queryKey: petStoreKeys.categories(homeOnly),
    queryFn: () => petOwnerStoreService.listCategories(homeOnly),
    staleTime: 60_000,
    enabled: options.enabled ?? true,
  });
}

/** Paginated consumer product catalogue with search + category filter + sort. */
export function usePetOwnerStoreProducts(params: ListPetStoreProductsParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter: ListPetStoreProductsParams = {
    categoryId: params.categoryId || undefined,
    search: params.search || undefined,
    sort: params.sort,
    order: params.order,
    pageSize,
  };

  const query = useInfiniteQuery<
    Paginated<PetStoreProductListItem>,
    unknown,
    InfiniteData<Paginated<PetStoreProductListItem>>,
    ReturnType<typeof petStoreKeys.productList>,
    number
  >({
    queryKey: petStoreKeys.productList(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      petOwnerStoreService.listProducts({ ...filter, page: pageParam, pageSize }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 15_000,
  });

  const products = useMemo<PetStoreProductListItem[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, products, total };
}

/** One product's detail (ACTIVE only — a hidden product 404s). */
export function usePetOwnerStoreProduct(productId: string | undefined) {
  return useQuery<PetStoreProductDetail, ApiError>({
    queryKey: petStoreKeys.product(productId ?? 'unknown'),
    queryFn: () => petOwnerStoreService.getProduct(productId as string),
    enabled: Boolean(productId),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });
}
