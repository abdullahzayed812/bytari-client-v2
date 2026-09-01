import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { productsApi, productKeys } from '../api';
import type { AdjustStockInput, CreateProductInput, Product, UpdateProductInput } from '../types';

/**
 * Veterinary-store product mutations, always scoped to one store. `organizationId`
 * / `createdByUserId` / `status` come from the route / JWT / server — never a
 * body. No optimistic updates: mutate → server success → invalidate the
 * narrowest prefix (§33).
 */

export function useCreateProduct(
  organizationId: string,
): UseMutationResult<Product, unknown, CreateProductInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['store-products', 'create', organizationId],
    mutationFn: (body: CreateProductInput) => productsApi.create(organizationId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: productKeys.forOrg(organizationId) });
    },
  });
}

export function useUpdateProduct(
  organizationId: string,
): UseMutationResult<Product, unknown, { productId: string; body: UpdateProductInput }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['store-products', 'update', organizationId],
    mutationFn: ({ productId, body }) => productsApi.update(organizationId, productId, body),
    onSuccess: (_data, { productId }) => {
      void qc.invalidateQueries({ queryKey: productKeys.detail(organizationId, productId) });
      void qc.invalidateQueries({ queryKey: productKeys.forOrg(organizationId) });
    },
  });
}

export function useDeleteProduct(
  organizationId: string,
): UseMutationResult<Product, unknown, { productId: string }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['store-products', 'delete', organizationId],
    mutationFn: ({ productId }) => productsApi.remove(organizationId, productId),
    onSuccess: (_data, { productId }) => {
      // Soft-delete — keep the detail entry but refresh it + the list.
      void qc.invalidateQueries({ queryKey: productKeys.detail(organizationId, productId) });
      void qc.invalidateQueries({ queryKey: productKeys.forOrg(organizationId) });
    },
  });
}

export function useAdjustStock(
  organizationId: string,
): UseMutationResult<Product, unknown, { productId: string; body: AdjustStockInput }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['store-products', 'stock', organizationId],
    mutationFn: ({ productId, body }) => productsApi.adjustStock(organizationId, productId, body),
    onSuccess: (_data, { productId }) => {
      void qc.invalidateQueries({ queryKey: productKeys.detail(organizationId, productId) });
      void qc.invalidateQueries({ queryKey: productKeys.forOrg(organizationId) });
    },
  });
}
