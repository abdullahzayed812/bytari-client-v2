import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { veterinaryOfficeProductsApi, veterinaryOfficeProductKeys } from '../api';
import type {
  AdjustVeterinaryOfficeStockInput,
  CreateVeterinaryOfficeProductInput,
  VeterinaryOfficeProduct,
  UpdateVeterinaryOfficeProductInput,
} from '../../types';

/**
 * Veterinary Office product mutations, always scoped to one office.
 * `organizationId` / `createdByUserId` / `status` come from the route / JWT /
 * server — never a body. No optimistic updates: mutate → server success →
 * invalidate the narrowest prefix.
 */

export function useCreateVeterinaryOfficeProduct(
  organizationId: string,
): UseMutationResult<VeterinaryOfficeProduct, unknown, CreateVeterinaryOfficeProductInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['office-products', 'create', organizationId],
    mutationFn: (body: CreateVeterinaryOfficeProductInput) =>
      veterinaryOfficeProductsApi.create(organizationId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: veterinaryOfficeProductKeys.forOrg(organizationId) });
    },
  });
}

export function useUpdateVeterinaryOfficeProduct(
  organizationId: string,
): UseMutationResult<
  VeterinaryOfficeProduct,
  unknown,
  { productId: string; body: UpdateVeterinaryOfficeProductInput }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['office-products', 'update', organizationId],
    mutationFn: ({ productId, body }) =>
      veterinaryOfficeProductsApi.update(organizationId, productId, body),
    onSuccess: (_data, { productId }) => {
      void qc.invalidateQueries({ queryKey: veterinaryOfficeProductKeys.detail(organizationId, productId) });
      void qc.invalidateQueries({ queryKey: veterinaryOfficeProductKeys.forOrg(organizationId) });
    },
  });
}

export function useDeleteVeterinaryOfficeProduct(
  organizationId: string,
): UseMutationResult<VeterinaryOfficeProduct, unknown, { productId: string }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['office-products', 'delete', organizationId],
    mutationFn: ({ productId }) => veterinaryOfficeProductsApi.remove(organizationId, productId),
    onSuccess: (_data, { productId }) => {
      // Soft-delete — keep the detail entry but refresh it + the list.
      void qc.invalidateQueries({ queryKey: veterinaryOfficeProductKeys.detail(organizationId, productId) });
      void qc.invalidateQueries({ queryKey: veterinaryOfficeProductKeys.forOrg(organizationId) });
    },
  });
}

export function useAdjustVeterinaryOfficeStock(
  organizationId: string,
): UseMutationResult<
  VeterinaryOfficeProduct,
  unknown,
  { productId: string; body: AdjustVeterinaryOfficeStockInput }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['office-products', 'stock', organizationId],
    mutationFn: ({ productId, body }) =>
      veterinaryOfficeProductsApi.adjustStock(organizationId, productId, body),
    onSuccess: (_data, { productId }) => {
      void qc.invalidateQueries({ queryKey: veterinaryOfficeProductKeys.detail(organizationId, productId) });
      void qc.invalidateQueries({ queryKey: veterinaryOfficeProductKeys.forOrg(organizationId) });
    },
  });
}

export function useRemoveVeterinaryOfficeProductImage(
  organizationId: string,
): UseMutationResult<VeterinaryOfficeProduct, unknown, { productId: string; imageId: string }> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['office-products', 'remove-image', organizationId],
    mutationFn: ({ productId, imageId }) =>
      veterinaryOfficeProductsApi.removeImage(organizationId, productId, imageId),
    onSuccess: (_data, { productId }) => {
      void qc.invalidateQueries({ queryKey: veterinaryOfficeProductKeys.detail(organizationId, productId) });
      void qc.invalidateQueries({ queryKey: veterinaryOfficeProductKeys.forOrg(organizationId) });
    },
  });
}
