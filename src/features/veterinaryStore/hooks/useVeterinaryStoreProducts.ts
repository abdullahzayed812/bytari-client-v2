import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { veterinaryStoreProductsApi, veterinaryStoreProductKeys } from '../api';
import type {
  Paginated,
  VeterinaryStoreProduct,
  VeterinaryStoreProductSort,
  VeterinaryStoreProductStatus,
  VeterinaryStoreProductType,
  SortOrder,
} from '../types';

export interface UseVeterinaryStoreProductsParams {
  status?: VeterinaryStoreProductStatus;
  productType?: VeterinaryStoreProductType;
  search?: string;
  sort?: VeterinaryStoreProductSort;
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
export function useVeterinaryStoreProducts(organizationId: string | undefined, params: UseVeterinaryStoreProductsParams = {}) {
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
    Paginated<VeterinaryStoreProduct>,
    unknown,
    InfiniteData<Paginated<VeterinaryStoreProduct>>,
    ReturnType<typeof veterinaryStoreProductKeys.list>,
    number
  >({
    queryKey: veterinaryStoreProductKeys.list(organizationId ?? 'unknown', filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      veterinaryStoreProductsApi.list(organizationId as string, {
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

  const products = useMemo<VeterinaryStoreProduct[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, products, total };
}

/** One product. A product id not under this store returns `404` (cross-store isolation). */
export function useVeterinaryStoreProduct(
  organizationId: string | undefined,
  productId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<VeterinaryStoreProduct, ApiError>({
    queryKey: veterinaryStoreProductKeys.detail(organizationId ?? 'unknown', productId ?? 'unknown'),
    queryFn: () => veterinaryStoreProductsApi.get(organizationId as string, productId as string),
    enabled: Boolean(organizationId) && Boolean(productId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}
