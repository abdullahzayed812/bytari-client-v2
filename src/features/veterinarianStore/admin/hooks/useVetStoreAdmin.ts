import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { vetStoreKeys } from '../../api';
import type {
  CreateVetStoreCategoryInput,
  CreateVetStoreProductInput,
  Paginated,
  VetStoreAdminProduct,
  VetStoreCategory,
  VetStoreOrder,
  VetStoreOrderStatus,
  VetStoreProductStatus,
  UpdateVetStoreCategoryInput,
  UpdateVetStoreProductInput,
} from '../../types';
import { veterinarianStoreAdminService } from '../api/veterinarianStoreAdminApi';

// --- products -----------------------------------------------------

export function useVetStoreAdminProducts(
  params: { search?: string; status?: VetStoreProductStatus } = {},
) {
  const pageSize = AppConfig.defaultPageSize;
  const filter = { search: params.search || undefined, status: params.status };

  const query = useInfiniteQuery<
    Paginated<VetStoreAdminProduct>,
    unknown,
    InfiniteData<Paginated<VetStoreAdminProduct>>,
    readonly unknown[],
    number
  >({
    queryKey: [...vetStoreKeys.adminProducts(), filter],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      veterinarianStoreAdminService.listProducts({ ...filter, page: pageParam, pageSize }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 10_000,
  });

  const products = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.meta.total ?? 0;
  return { ...query, products, total };
}

export function useVetStoreAdminProduct(productId: string | undefined) {
  return useQuery<VetStoreAdminProduct, ApiError>({
    queryKey: vetStoreKeys.adminProduct(productId ?? 'unknown'),
    queryFn: () => veterinarianStoreAdminService.getProduct(productId as string),
    enabled: Boolean(productId),
  });
}

export function useVetStoreAdminProductMutations() {
  const qc = useQueryClient();
  const invalidate = (productId?: string): void => {
    void qc.invalidateQueries({ queryKey: vetStoreKeys.adminProducts() });
    void qc.invalidateQueries({ queryKey: vetStoreKeys.products() });
    void qc.invalidateQueries({ queryKey: vetStoreKeys.categories() });
    void qc.invalidateQueries({ queryKey: vetStoreKeys.adminCategories() });
    if (productId) void qc.invalidateQueries({ queryKey: vetStoreKeys.adminProduct(productId) });
  };

  const create = useMutation<VetStoreAdminProduct, ApiError, CreateVetStoreProductInput>({
    mutationFn: (body) => veterinarianStoreAdminService.createProduct(body),
    onSuccess: (p) => invalidate(p.id),
  });
  const update = useMutation<
    VetStoreAdminProduct,
    ApiError,
    { productId: string; body: UpdateVetStoreProductInput }
  >({
    mutationFn: ({ productId, body }) => veterinarianStoreAdminService.updateProduct(productId, body),
    onSuccess: (p) => invalidate(p.id),
  });
  const deactivate = useMutation<VetStoreAdminProduct, ApiError, string>({
    mutationFn: (productId) => veterinarianStoreAdminService.deactivateProduct(productId),
    onSuccess: (p) => invalidate(p.id),
  });
  const removeImage = useMutation<
    VetStoreAdminProduct,
    ApiError,
    { productId: string; imageId: string }
  >({
    mutationFn: ({ productId, imageId }) =>
      veterinarianStoreAdminService.removeProductImage(productId, imageId),
    onSuccess: (p) => invalidate(p.id),
  });

  return { create, update, deactivate, removeImage };
}

// --- categories ---------------------------------------------------

export function useVetStoreAdminCategories() {
  return useQuery<VetStoreCategory[], ApiError>({
    queryKey: vetStoreKeys.adminCategories(),
    queryFn: () => veterinarianStoreAdminService.listCategories(),
    staleTime: 30_000,
  });
}

export function useVetStoreAdminCategoryMutations() {
  const qc = useQueryClient();
  const invalidate = (): void => {
    void qc.invalidateQueries({ queryKey: vetStoreKeys.adminCategories() });
    void qc.invalidateQueries({ queryKey: vetStoreKeys.categories() });
  };

  const create = useMutation<VetStoreCategory, ApiError, CreateVetStoreCategoryInput>({
    mutationFn: (body) => veterinarianStoreAdminService.createCategory(body),
    onSuccess: invalidate,
  });
  const update = useMutation<
    VetStoreCategory,
    ApiError,
    { categoryId: string; body: UpdateVetStoreCategoryInput }
  >({
    mutationFn: ({ categoryId, body }) =>
      veterinarianStoreAdminService.updateCategory(categoryId, body),
    onSuccess: invalidate,
  });
  const remove = useMutation<void, ApiError, string>({
    mutationFn: (categoryId) => veterinarianStoreAdminService.deleteCategory(categoryId),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

// --- orders -----------------------------------------------------

export function useVetStoreAdminOrders(status?: VetStoreOrderStatus) {
  const pageSize = AppConfig.defaultPageSize;
  const query = useInfiniteQuery<
    Paginated<VetStoreOrder>,
    unknown,
    InfiniteData<Paginated<VetStoreOrder>>,
    readonly unknown[],
    number
  >({
    queryKey: vetStoreKeys.adminOrders(status),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      veterinarianStoreAdminService.listOrders({ page: pageParam, pageSize, status }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 10_000,
  });
  const orders = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.meta.total ?? 0;
  return { ...query, orders, total };
}

export function useVetStoreAdminOrder(orderId: string | undefined) {
  return useQuery<VetStoreOrder, ApiError>({
    queryKey: vetStoreKeys.adminOrder(orderId ?? 'unknown'),
    queryFn: () => veterinarianStoreAdminService.getOrder(orderId as string),
    enabled: Boolean(orderId),
  });
}

export function useUpdateVetStoreOrderStatus() {
  const qc = useQueryClient();
  return useMutation<VetStoreOrder, ApiError, { orderId: string; status: VetStoreOrderStatus }>({
    mutationFn: ({ orderId, status }) =>
      veterinarianStoreAdminService.updateOrderStatus(orderId, status),
    onSuccess: (order) => {
      qc.setQueryData(vetStoreKeys.adminOrder(order.id), order);
      void qc.invalidateQueries({ queryKey: vetStoreKeys.admin() });
      void qc.invalidateQueries({ queryKey: vetStoreKeys.orders() });
    },
  });
}
