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

import { petStoreKeys } from '../../api';
import type {
  CreatePetStoreCategoryInput,
  CreatePetStoreProductInput,
  Paginated,
  PetStoreAdminProduct,
  PetStoreCategory,
  PetStoreOrder,
  PetStoreOrderStatus,
  PetStoreProductStatus,
  UpdatePetStoreCategoryInput,
  UpdatePetStoreProductInput,
} from '../../types';
import { petOwnerStoreAdminService } from '../api/petOwnerStoreAdminApi';

// --- products -----------------------------------------------------

export function usePetStoreAdminProducts(
  params: { search?: string; status?: PetStoreProductStatus } = {},
) {
  const pageSize = AppConfig.defaultPageSize;
  const filter = { search: params.search || undefined, status: params.status };

  const query = useInfiniteQuery<
    Paginated<PetStoreAdminProduct>,
    unknown,
    InfiniteData<Paginated<PetStoreAdminProduct>>,
    readonly unknown[],
    number
  >({
    queryKey: [...petStoreKeys.adminProducts(), filter],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      petOwnerStoreAdminService.listProducts({ ...filter, page: pageParam, pageSize }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 10_000,
  });

  const products = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.meta.total ?? 0;
  return { ...query, products, total };
}

export function usePetStoreAdminProduct(productId: string | undefined) {
  return useQuery<PetStoreAdminProduct, ApiError>({
    queryKey: petStoreKeys.adminProduct(productId ?? 'unknown'),
    queryFn: () => petOwnerStoreAdminService.getProduct(productId as string),
    enabled: Boolean(productId),
  });
}

export function usePetStoreAdminProductMutations() {
  const qc = useQueryClient();
  const invalidate = (productId?: string): void => {
    void qc.invalidateQueries({ queryKey: petStoreKeys.adminProducts() });
    void qc.invalidateQueries({ queryKey: petStoreKeys.products() });
    void qc.invalidateQueries({ queryKey: petStoreKeys.categories() });
    void qc.invalidateQueries({ queryKey: petStoreKeys.adminCategories() });
    if (productId) void qc.invalidateQueries({ queryKey: petStoreKeys.adminProduct(productId) });
  };

  const create = useMutation<PetStoreAdminProduct, ApiError, CreatePetStoreProductInput>({
    mutationFn: (body) => petOwnerStoreAdminService.createProduct(body),
    onSuccess: (p) => invalidate(p.id),
  });
  const update = useMutation<
    PetStoreAdminProduct,
    ApiError,
    { productId: string; body: UpdatePetStoreProductInput }
  >({
    mutationFn: ({ productId, body }) => petOwnerStoreAdminService.updateProduct(productId, body),
    onSuccess: (p) => invalidate(p.id),
  });
  const deactivate = useMutation<PetStoreAdminProduct, ApiError, string>({
    mutationFn: (productId) => petOwnerStoreAdminService.deactivateProduct(productId),
    onSuccess: (p) => invalidate(p.id),
  });
  const removeImage = useMutation<
    PetStoreAdminProduct,
    ApiError,
    { productId: string; imageId: string }
  >({
    mutationFn: ({ productId, imageId }) =>
      petOwnerStoreAdminService.removeProductImage(productId, imageId),
    onSuccess: (p) => invalidate(p.id),
  });

  return { create, update, deactivate, removeImage };
}

// --- categories ---------------------------------------------------

export function usePetStoreAdminCategories() {
  return useQuery<PetStoreCategory[], ApiError>({
    queryKey: petStoreKeys.adminCategories(),
    queryFn: () => petOwnerStoreAdminService.listCategories(),
    staleTime: 30_000,
  });
}

export function usePetStoreAdminCategoryMutations() {
  const qc = useQueryClient();
  const invalidate = (): void => {
    void qc.invalidateQueries({ queryKey: petStoreKeys.adminCategories() });
    void qc.invalidateQueries({ queryKey: petStoreKeys.categories() });
  };

  const create = useMutation<PetStoreCategory, ApiError, CreatePetStoreCategoryInput>({
    mutationFn: (body) => petOwnerStoreAdminService.createCategory(body),
    onSuccess: invalidate,
  });
  const update = useMutation<
    PetStoreCategory,
    ApiError,
    { categoryId: string; body: UpdatePetStoreCategoryInput }
  >({
    mutationFn: ({ categoryId, body }) =>
      petOwnerStoreAdminService.updateCategory(categoryId, body),
    onSuccess: invalidate,
  });
  const remove = useMutation<void, ApiError, string>({
    mutationFn: (categoryId) => petOwnerStoreAdminService.deleteCategory(categoryId),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

// --- orders -----------------------------------------------------

export function usePetStoreAdminOrders(status?: PetStoreOrderStatus) {
  const pageSize = AppConfig.defaultPageSize;
  const query = useInfiniteQuery<
    Paginated<PetStoreOrder>,
    unknown,
    InfiniteData<Paginated<PetStoreOrder>>,
    readonly unknown[],
    number
  >({
    queryKey: petStoreKeys.adminOrders(status),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      petOwnerStoreAdminService.listOrders({ page: pageParam, pageSize, status }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 10_000,
  });
  const orders = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.meta.total ?? 0;
  return { ...query, orders, total };
}

export function usePetStoreAdminOrder(orderId: string | undefined) {
  return useQuery<PetStoreOrder, ApiError>({
    queryKey: petStoreKeys.adminOrder(orderId ?? 'unknown'),
    queryFn: () => petOwnerStoreAdminService.getOrder(orderId as string),
    enabled: Boolean(orderId),
  });
}

export function useUpdatePetStoreOrderStatus() {
  const qc = useQueryClient();
  return useMutation<PetStoreOrder, ApiError, { orderId: string; status: PetStoreOrderStatus }>({
    mutationFn: ({ orderId, status }) =>
      petOwnerStoreAdminService.updateOrderStatus(orderId, status),
    onSuccess: (order) => {
      qc.setQueryData(petStoreKeys.adminOrder(order.id), order);
      void qc.invalidateQueries({ queryKey: petStoreKeys.admin() });
      void qc.invalidateQueries({ queryKey: petStoreKeys.orders() });
    },
  });
}
