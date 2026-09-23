import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { PresignProvider } from '@/services/files/types';

import { vetStoreKeys } from '../../api';
import { veterinarianStoreAdminService } from '../api/veterinarianStoreAdminApi';

/**
 * `PresignProvider` for a Veterinarian Store category's photo. Mirrors
 * `usePetStoreCategoryImagePresignProvider` exactly — presign, `PUT` the bytes
 * straight to R2, then register the image on the category (replacing any
 * previous one). This is what `HomeCategoryCircle`'s `category.imageUrl`
 * renders; without it the endpoint existed but nothing could reach it.
 */
export function useVetStoreCategoryImagePresignProvider(
  categoryId: string | undefined,
): PresignProvider {
  const qc = useQueryClient();
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) => {
        if (!categoryId) throw new Error('categoryId is required');
        return veterinarianStoreAdminService.requestCategoryImageUploadUrl(categoryId, {
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        });
      },
      finalizeUpload: async (storageKey, file) => {
        if (!categoryId) throw new Error('categoryId is required');
        await veterinarianStoreAdminService.registerCategoryImage(categoryId, {
          storageKey,
          mimeType: file.mimeType,
        });
        void qc.invalidateQueries({ queryKey: vetStoreKeys.adminCategories() });
        void qc.invalidateQueries({ queryKey: [...vetStoreKeys.all, 'categories'] });
      },
    }),
    [categoryId, qc],
  );
}
