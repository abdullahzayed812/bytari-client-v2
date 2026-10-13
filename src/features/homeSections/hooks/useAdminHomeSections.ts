import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { ApiError } from '@/services/api';
import type { PresignProvider } from '@/services/files/types';

import { homeSectionKeys, homeSectionsApi } from '../api';
import type { HomeSectionImage, HomeSectionKey } from '../types';

/** Admin list: every section with its current image (or `null`). */
export function useAdminHomeSections() {
  return useQuery<HomeSectionImage[], ApiError>({
    queryKey: homeSectionKeys.adminList(),
    queryFn: () => homeSectionsApi.adminList(),
  });
}

/**
 * `PresignProvider` for one section's image: request a presigned URL, `PUT`
 * the bytes straight to R2, then register it on the section (which replaces
 * any previous image server-side). Refreshes both the admin list and the
 * home pages' read.
 */
export function useHomeSectionImagePresignProvider(key: HomeSectionKey): PresignProvider {
  const qc = useQueryClient();
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) =>
        homeSectionsApi.requestUploadUrl(key, {
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        }),
      finalizeUpload: async (storageKey, file) => {
        await homeSectionsApi.registerImage(key, { storageKey, mimeType: file.mimeType });
        void qc.invalidateQueries({ queryKey: homeSectionKeys.all });
      },
    }),
    [key, qc],
  );
}

/** Back to the built-in icon. */
export function useRemoveHomeSectionImage() {
  const qc = useQueryClient();
  return useMutation<HomeSectionImage, ApiError, HomeSectionKey>({
    mutationKey: ['home-sections', 'remove-image'],
    mutationFn: (key) => homeSectionsApi.removeImage(key),
    onSuccess: () => void qc.invalidateQueries({ queryKey: homeSectionKeys.all }),
  });
}
