import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { veterinaryStoreProductsApi, veterinaryStoreProductKeys } from '../api';
import type { AdjustVeterinaryStoreStockInput, CreateVeterinaryStoreProductInput, VeterinaryStoreProduct, UpdateVeterinaryStoreProductInput } from '../types';

/**
 * Veterinary-store product mutations, always scoped to one store. `organizationId`
 * / `createdByUserId` / `status` come from the route / JWT / server — never a
 * body. No optimistic updates: mutate → server success → invalidate the
 * narrowest prefix (§33).
 */

export function useCreateVeterinaryStoreProduct(
  organizationId: string,
): UseMutationResult<VeterinaryStoreProduct, unknown, CreateVeterinaryStoreProductInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['store-products', 'create', organizationId],
    mutationFn: (body: CreateVeterinaryStoreProductInput) => veterinaryStoreProductsApi.create(organizationId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: veterinaryStoreProductKeys.forOrg(organizationId) });
    },
  });
}

export function useUpdateVeterinaryStoreProduct(
  organizationId: string,
): UseMutationResult<VeterinaryStoreProduct, unknown, { productId: string; body: UpdateVeterinaryStoreProductInput }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['store-products', 'update', organizationId],
    mutationFn: ({ productId, body }) => veterinaryStoreProductsApi.update(organizationId, productId, body),
    onSuccess: (_data, { productId }) => {
      void qc.invalidateQueries({ queryKey: veterinaryStoreProductKeys.detail(organizationId, productId) });
      void qc.invalidateQueries({ queryKey: veterinaryStoreProductKeys.forOrg(organizationId) });
    },
  });
}

export function useDeleteVeterinaryStoreProduct(
  organizationId: string,
): UseMutationResult<VeterinaryStoreProduct, unknown, { productId: string }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['store-products', 'delete', organizationId],
    mutationFn: ({ productId }) => veterinaryStoreProductsApi.remove(organizationId, productId),
    onSuccess: (_data, { productId }) => {
      // Soft-delete — keep the detail entry but refresh it + the list.
      void qc.invalidateQueries({ queryKey: veterinaryStoreProductKeys.detail(organizationId, productId) });
      void qc.invalidateQueries({ queryKey: veterinaryStoreProductKeys.forOrg(organizationId) });
    },
  });
}

export function useAdjustVeterinaryStoreStock(
  organizationId: string,
): UseMutationResult<VeterinaryStoreProduct, unknown, { productId: string; body: AdjustVeterinaryStoreStockInput }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['store-products', 'stock', organizationId],
    mutationFn: ({ productId, body }) => veterinaryStoreProductsApi.adjustStock(organizationId, productId, body),
    onSuccess: (_data, { productId }) => {
      void qc.invalidateQueries({ queryKey: veterinaryStoreProductKeys.detail(organizationId, productId) });
      void qc.invalidateQueries({ queryKey: veterinaryStoreProductKeys.forOrg(organizationId) });
    },
  });
}

export function useRemoveVeterinaryStoreProductImage(
  organizationId: string,
): UseMutationResult<VeterinaryStoreProduct, unknown, { productId: string; imageId: string }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['store-products', 'remove-image', organizationId],
    mutationFn: ({ productId, imageId }) =>
      veterinaryStoreProductsApi.removeImage(organizationId, productId, imageId),
    onSuccess: (_data, { productId }) => {
      void qc.invalidateQueries({ queryKey: veterinaryStoreProductKeys.detail(organizationId, productId) });
      void qc.invalidateQueries({ queryKey: veterinaryStoreProductKeys.forOrg(organizationId) });
    },
  });
}
