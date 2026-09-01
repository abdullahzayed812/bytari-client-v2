import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { productsApi, productKeys } from '../api';
import type {
  Paginated,
  Product,
  ProductSort,
  ProductStatus,
  ProductType,
  SortOrder,
} from '../types';

export interface UseProductsParams {
  status?: ProductStatus;
  productType?: ProductType;
  search?: string;
  sort?: ProductSort;
  order?: SortOrder;
  pageSize?: number;
  enabled?: boolean;
}

/**
 * A veterinary store's product catalogue. Requires `product.read` on the
 * organization server-side. Paginated (`page`/`pageSize`) with the backend's
 * own `status` / `type` / `search` filters and `sort` / `order` (§8/§9). The
 * store id is part of the query key so two stores never share a cache entry.
 */
export function useProducts(organizationId: string | undefined, params: UseProductsParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = {
    status: params.status,
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
    ReturnType<typeof productKeys.list>,
    number
  >({
    queryKey: productKeys.list(organizationId ?? 'unknown', filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      productsApi.list(organizationId as string, {
        page: pageParam,
        pageSize,
        status: params.status,
        productType: params.productType,
        search: params.search || undefined,
        sort: params.sort,
        order: params.order,
      }),
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

/** One product. A product id not under this store returns `404` (cross-store isolation). */
export function useProduct(
  organizationId: string | undefined,
  productId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<Product, ApiError>({
    queryKey: productKeys.detail(organizationId ?? 'unknown', productId ?? 'unknown'),
    queryFn: () => productsApi.get(organizationId as string, productId as string),
    enabled: Boolean(organizationId) && Boolean(productId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}
