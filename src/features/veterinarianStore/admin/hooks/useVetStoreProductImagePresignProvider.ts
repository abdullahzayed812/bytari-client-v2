import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { PresignProvider } from '@/services/files/types';

import { vetStoreKeys } from '../../api';
import { veterinarianStoreAdminService } from '../api/veterinarianStoreAdminApi';

/**
 * `PresignProvider` for a Veterinarian Store product's image gallery. The uploader
 * requests a presigned URL, `PUT`s the bytes straight to R2, then this registers
 * the image on the product (the first image becomes the primary). Storage
 * credentials never touch the app.
 */
export function useVetStoreProductImagePresignProvider(
  productId: string | undefined,
): PresignProvider {
  const qc = useQueryClient();
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) => {
        if (!productId) throw new Error('productId is required');
        return veterinarianStoreAdminService.requestProductImageUploadUrl(productId, {
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        });
      },
      finalizeUpload: async (storageKey, file) => {
        if (!productId) throw new Error('productId is required');
        await veterinarianStoreAdminService.registerProductImage(productId, {
          storageKey,
          mimeType: file.mimeType,
        });
        void qc.invalidateQueries({ queryKey: vetStoreKeys.adminProduct(productId) });
        void qc.invalidateQueries({ queryKey: vetStoreKeys.products() });
      },
    }),
    [productId, qc],
  );
}
