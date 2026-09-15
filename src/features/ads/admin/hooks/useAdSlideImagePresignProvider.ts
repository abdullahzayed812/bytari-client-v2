import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { PresignProvider } from '@/services/files/types';

import { adKeys } from '../../api';
import { adminAdsApi } from '../api/adminAdsApi';

/**
 * `PresignProvider` for one ad slide's image. The uploader requests a
 * presigned URL, `PUT`s the bytes straight to R2, then this registers the
 * image on the slide. Storage credentials never touch the app.
 */
export function useAdSlideImagePresignProvider(
  campaignId: string | undefined,
  slideId: string | undefined,
): PresignProvider {
  const qc = useQueryClient();
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) => {
        if (!campaignId || !slideId) throw new Error('campaignId and slideId are required');
        return adminAdsApi.requestSlideUploadUrl(campaignId, slideId, {
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        });
      },
      finalizeUpload: async (storageKey, file) => {
        if (!campaignId || !slideId) throw new Error('campaignId and slideId are required');
        await adminAdsApi.registerSlideImage(campaignId, slideId, {
          storageKey,
          mimeType: file.mimeType,
        });
        void qc.invalidateQueries({ queryKey: adKeys.adminCampaign(campaignId) });
        void qc.invalidateQueries({ queryKey: adKeys.all });
      },
    }),
    [campaignId, slideId, qc],
  );
}
