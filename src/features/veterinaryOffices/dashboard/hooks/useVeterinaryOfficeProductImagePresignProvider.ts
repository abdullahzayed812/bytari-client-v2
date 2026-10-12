import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';

import type { PresignProvider } from '@/services/files/types';

import { veterinaryOfficeProductsApi, veterinaryOfficeProductKeys } from '../api';

/**
 * `PresignProvider` for a Veterinary Office product's image gallery. The
 * uploader requests a presigned URL, `PUT`s the bytes straight to R2, then
 * this registers the image on the product (the first image becomes primary,
 * server-side). Mirrors `usePetStoreProductImagePresignProvider` exactly.
 */
export function useVeterinaryOfficeProductImagePresignProvider(
  organizationId: string,
  productId: string | undefined,
): PresignProvider {
  const qc = useQueryClient();
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) => {
        if (!productId) throw new Error('productId is required');
        return veterinaryOfficeProductsApi.requestImageUploadUrl(organizationId, productId, {
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        });
      },
      finalizeUpload: async (storageKey, file) => {
        if (!productId) throw new Error('productId is required');
        await veterinaryOfficeProductsApi.addImage(organizationId, productId, {
          storageKey,
          mimeType: file.mimeType,
        });
        void qc.invalidateQueries({
          queryKey: veterinaryOfficeProductKeys.detail(organizationId, productId),
        });
        void qc.invalidateQueries({ queryKey: veterinaryOfficeProductKeys.forOrg(organizationId) });
      },
    }),
    [organizationId, productId, qc],
  );
}

/** A finished upload not yet attached to any product. */
export interface PendingProductImage {
  storageKey: string;
  mimeType: string;
}

/**
 * `PresignProvider` for the "add product" form: the image is uploaded BEFORE
 * the product exists (org-level presign) and handed to `onUploaded`; the form
 * sends it as `image` in the create body, which attaches it atomically.
 * Picking another image simply replaces the pending one.
 */
export function useNewVeterinaryOfficeProductImagePresignProvider(
  organizationId: string,
  onUploaded: (image: PendingProductImage) => void,
): PresignProvider {
  const onUploadedRef = useRef(onUploaded);
  onUploadedRef.current = onUploaded;
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) =>
        veterinaryOfficeProductsApi.requestNewProductImageUploadUrl(organizationId, {
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        }),
      finalizeUpload: async (storageKey, file) => {
        onUploadedRef.current({ storageKey, mimeType: file.mimeType });
      },
    }),
    [organizationId],
  );
}

/**
 * `PresignProvider` that REPLACES one existing image: upload first, then swap
 * server-side. If the upload fails, `finalizeUpload` never runs and the
 * current image stays as it was.
 */
export function useReplaceVeterinaryOfficeProductImagePresignProvider(
  organizationId: string,
  productId: string | undefined,
  imageId: string | undefined,
): PresignProvider {
  const qc = useQueryClient();
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) => {
        if (!productId || !imageId) throw new Error('productId and imageId are required');
        return veterinaryOfficeProductsApi.requestReplaceImageUploadUrl(
          organizationId,
          productId,
          imageId,
          { filename: file.name, mimeType: file.mimeType, size: file.size ?? 0 },
        );
      },
      finalizeUpload: async (storageKey, file) => {
        if (!productId || !imageId) throw new Error('productId and imageId are required');
        await veterinaryOfficeProductsApi.replaceImage(organizationId, productId, imageId, {
          storageKey,
          mimeType: file.mimeType,
        });
        void qc.invalidateQueries({
          queryKey: veterinaryOfficeProductKeys.detail(organizationId, productId),
        });
        void qc.invalidateQueries({ queryKey: veterinaryOfficeProductKeys.forOrg(organizationId) });
      },
    }),
    [organizationId, productId, imageId, qc],
  );
}
