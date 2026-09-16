import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { veterinaryOfficeProductsApi, veterinaryOfficeProductKeys } from '../api';
import type {
  Paginated,
  VeterinaryOfficeProduct,
  VeterinaryOfficeProductSort,
  VeterinaryOfficeProductStatus,
  VeterinaryOfficeProductType,
  SortOrder,
} from '../../types';

export interface UseVeterinaryOfficeProductsParams {
  status?: VeterinaryOfficeProductStatus;
  productType?: VeterinaryOfficeProductType;
  /** Owner-facing "Hidden products" screen filter. */
  hidden?: boolean;
  search?: string;
  sort?: VeterinaryOfficeProductSort;
  order?: SortOrder;
  pageSize?: number;
  enabled?: boolean;
}

/**
 * A veterinary office's product catalogue (management). Requires
 * `product.read` on the organization server-side. Paginated with the
 * backend's own `status` / `type` / `search` filters and `sort` / `order`.
 * The office id is part of the query key so two offices never share a cache
 * entry.
 */
export function useVeterinaryOfficeProducts(
  organizationId: string | undefined,
  params: UseVeterinaryOfficeProductsParams = {},
) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = {
    status: params.status,
    productType: params.productType,
    hidden: params.hidden,
    search: params.search || undefined,
    sort: params.sort,
    order: params.order,
    pageSize,
  };

  const query = useInfiniteQuery<
    Paginated<VeterinaryOfficeProduct>,
    unknown,
    InfiniteData<Paginated<VeterinaryOfficeProduct>>,
    ReturnType<typeof veterinaryOfficeProductKeys.list>,
    number
  >({
    queryKey: veterinaryOfficeProductKeys.list(organizationId ?? 'unknown', filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      veterinaryOfficeProductsApi.list(organizationId as string, {
        page: pageParam,
        pageSize,
        status: params.status,
        productType: params.productType,
        hidden: params.hidden,
        search: params.search || undefined,
        sort: params.sort,
        order: params.order,
      }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(organizationId) && (params.enabled ?? true),
    staleTime: 15_000,
  });

  const products = useMemo<VeterinaryOfficeProduct[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, products, total };
}

/** One product. A product id not under this office returns `404` (cross-office isolation). */
export function useVeterinaryOfficeProduct(
  organizationId: string | undefined,
  productId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<VeterinaryOfficeProduct, ApiError>({
    queryKey: veterinaryOfficeProductKeys.detail(organizationId ?? 'unknown', productId ?? 'unknown'),
    queryFn: () => veterinaryOfficeProductsApi.get(organizationId as string, productId as string),
    enabled: Boolean(organizationId) && Boolean(productId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}
