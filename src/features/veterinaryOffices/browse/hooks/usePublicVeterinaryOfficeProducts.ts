import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import type {
  Paginated,
  VeterinaryOfficeProduct,
  VeterinaryOfficeProductSort,
  VeterinaryOfficeProductType,
  SortOrder,
} from '../../types';
import { publicVeterinaryOfficeProductKeys, publicVeterinaryOfficeProductsApi } from '../api';

export interface UsePublicVeterinaryOfficeProductsParams {
  productType?: VeterinaryOfficeProductType;
  search?: string;
  brand?: string;
  country?: string;
  sort?: VeterinaryOfficeProductSort;
  order?: SortOrder;
  pageSize?: number;
  enabled?: boolean;
}

/** Brand / country filter values for one office's public catalog. */
export function usePublicVeterinaryOfficeProductFacets(organizationId: string | undefined) {
  return useQuery({
    queryKey: publicVeterinaryOfficeProductKeys.facets(organizationId ?? 'unknown'),
    queryFn: () => publicVeterinaryOfficeProductsApi.facets(organizationId as string),
    enabled: Boolean(organizationId),
    staleTime: 60_000,
  });
}

/**
 * A veterinary office's public product catalog — any authenticated user,
 * ACTIVE organization + ACTIVE products only. Paginated with the backend's
 * own `type` / `search` filters and `sort` / `order`.
 */
export function usePublicVeterinaryOfficeProducts(
  organizationId: string | undefined,
  params: UsePublicVeterinaryOfficeProductsParams = {},
) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = {
    productType: params.productType,
    search: params.search || undefined,
    brand: params.brand || undefined,
    country: params.country || undefined,
    sort: params.sort,
    order: params.order,
    pageSize,
  };

  const query = useInfiniteQuery<
    Paginated<VeterinaryOfficeProduct>,
    unknown,
    InfiniteData<Paginated<VeterinaryOfficeProduct>>,
    ReturnType<typeof publicVeterinaryOfficeProductKeys.list>,
    number
  >({
    queryKey: publicVeterinaryOfficeProductKeys.list(organizationId ?? 'unknown', filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      publicVeterinaryOfficeProductsApi.list(organizationId as string, {
        ...filter,
        page: pageParam,
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

/** One product from the public catalog. 404 if the office/product isn't visible. */
export function usePublicVeterinaryOfficeProduct(
  organizationId: string | undefined,
  productId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<VeterinaryOfficeProduct, ApiError>({
    queryKey: publicVeterinaryOfficeProductKeys.detail(
      organizationId ?? 'unknown',
      productId ?? 'unknown',
    ),
    queryFn: () =>
      publicVeterinaryOfficeProductsApi.get(organizationId as string, productId as string),
    enabled: Boolean(organizationId) && Boolean(productId) && (options.enabled ?? true),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });
}
