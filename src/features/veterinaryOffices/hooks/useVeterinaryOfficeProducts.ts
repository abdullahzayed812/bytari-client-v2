import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import type { Paginated, Product, ProductSort, ProductType, SortOrder } from '@/features/store';
import { ApiError } from '@/services/api';

import { veterinaryOfficeProductKeys, veterinaryOfficeProductsApi } from '../api';

export interface UseVeterinaryOfficeProductsParams {
  productType?: ProductType;
  search?: string;
  sort?: ProductSort;
  order?: SortOrder;
  pageSize?: number;
  enabled?: boolean;
}

/**
 * A veterinary office's (or store's) public product catalog — any
 * authenticated user, ACTIVE organization + ACTIVE products only. Paginated
 * with the backend's own `type` / `search` filters and `sort` / `order`.
 */
export function useVeterinaryOfficeProducts(
  organizationId: string | undefined,
  params: UseVeterinaryOfficeProductsParams = {},
) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = {
    productType: params.productType,
    search: params.search || undefined,
    sort: params.sort,
    order: params.order,
    pageSize,
  };

  const query = useInfiniteQuery<
    Paginated<Product>,
    unknown,
    InfiniteData<Paginated<Product>>,
    ReturnType<typeof veterinaryOfficeProductKeys.list>,
    number
  >({
    queryKey: veterinaryOfficeProductKeys.list(organizationId ?? 'unknown', filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      veterinaryOfficeProductsApi.list(organizationId as string, { ...filter, page: pageParam }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(organizationId) && (params.enabled ?? true),
    staleTime: 15_000,
  });

  const products = useMemo<Product[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, products, total };
}

/** One product from the public catalog. 404 if the office/product isn't visible. */
export function useVeterinaryOfficeProduct(
  organizationId: string | undefined,
  productId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<Product, ApiError>({
    queryKey: veterinaryOfficeProductKeys.detail(
      organizationId ?? 'unknown',
      productId ?? 'unknown',
    ),
    queryFn: () =>
      veterinaryOfficeProductsApi.get(organizationId as string, productId as string),
    enabled: Boolean(organizationId) && Boolean(productId) && (options.enabled ?? true),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });
}
