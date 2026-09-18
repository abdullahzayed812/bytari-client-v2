import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { PresignProvider } from '@/services/files/types';

import { veterinaryStoreProductsApi, veterinaryStoreProductKeys } from '../api';

/**
 * `PresignProvider` for a Veterinary Store product's image gallery. Mirrors
 * `useVeterinaryOfficeProductImagePresignProvider` exactly — the uploader
 * requests a presigned URL, `PUT`s the bytes straight to R2, then this
 * registers the image on the product (the first image becomes primary,
 * server-side).
 */
export function useVeterinaryStoreProductImagePresignProvider(
  organizationId: string,
  productId: string | undefined,
): PresignProvider {
  const qc = useQueryClient();
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) => {
        if (!productId) throw new Error('productId is required');
        return veterinaryStoreProductsApi.requestImageUploadUrl(organizationId, productId, {
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        });
      },
      finalizeUpload: async (storageKey, file) => {
        if (!productId) throw new Error('productId is required');
        await veterinaryStoreProductsApi.addImage(organizationId, productId, {
          storageKey,
          mimeType: file.mimeType,
        });
        void qc.invalidateQueries({
          queryKey: veterinaryStoreProductKeys.detail(organizationId, productId),
        });
        void qc.invalidateQueries({ queryKey: veterinaryStoreProductKeys.forOrg(organizationId) });
      },
    }),
    [organizationId, productId, qc],
  );
}
