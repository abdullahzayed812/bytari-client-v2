import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

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
