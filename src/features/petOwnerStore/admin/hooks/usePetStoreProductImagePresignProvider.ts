import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { PresignProvider } from '@/services/files/types';

import { petStoreKeys } from '../../api';
import { petOwnerStoreAdminService } from '../api/petOwnerStoreAdminApi';

/**
 * `PresignProvider` for a Pet Owners Store product's image gallery. The uploader
 * requests a presigned URL, `PUT`s the bytes straight to R2, then this registers
 * the image on the product (the first image becomes the primary). Storage
 * credentials never touch the app.
 */
export function usePetStoreProductImagePresignProvider(
  productId: string | undefined,
): PresignProvider {
  const qc = useQueryClient();
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) => {
        if (!productId) throw new Error('productId is required');
        return petOwnerStoreAdminService.requestProductImageUploadUrl(productId, {
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        });
      },
      finalizeUpload: async (storageKey, file) => {
        if (!productId) throw new Error('productId is required');
        await petOwnerStoreAdminService.registerProductImage(productId, {
          storageKey,
          mimeType: file.mimeType,
        });
        void qc.invalidateQueries({ queryKey: petStoreKeys.adminProduct(productId) });
        void qc.invalidateQueries({ queryKey: petStoreKeys.products() });
      },
    }),
    [productId, qc],
  );
}
