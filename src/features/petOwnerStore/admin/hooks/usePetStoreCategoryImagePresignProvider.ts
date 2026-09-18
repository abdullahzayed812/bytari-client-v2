import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { PresignProvider } from '@/services/files/types';

import { petStoreKeys } from '../../api';
import { petOwnerStoreAdminService } from '../api/petOwnerStoreAdminApi';

/**
 * `PresignProvider` for a Pet Owners Store category's photo. Mirrors
 * `usePetStoreProductImagePresignProvider` exactly — the uploader requests a
 * presigned URL, `PUT`s the bytes straight to R2, then this registers the
 * image on the category (replacing any previous one).
 */
export function usePetStoreCategoryImagePresignProvider(
  categoryId: string | undefined,
): PresignProvider {
  const qc = useQueryClient();
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) => {
        if (!categoryId) throw new Error('categoryId is required');
        return petOwnerStoreAdminService.requestCategoryImageUploadUrl(categoryId, {
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        });
      },
      finalizeUpload: async (storageKey, file) => {
        if (!categoryId) throw new Error('categoryId is required');
        await petOwnerStoreAdminService.registerCategoryImage(categoryId, {
          storageKey,
          mimeType: file.mimeType,
        });
        void qc.invalidateQueries({ queryKey: petStoreKeys.adminCategories() });
        void qc.invalidateQueries({ queryKey: [...petStoreKeys.all, 'categories'] });
      },
    }),
    [categoryId, qc],
  );
}
