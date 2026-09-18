import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { PresignProvider } from '@/services/files/types';

import { orgKeys, organizationsApi } from '../api';

/**
 * `PresignProvider` for an organization's gallery — mirrors
 * `useOrganizationLogoPresignProvider`, but appends to the gallery array
 * instead of replacing a single logo.
 */
export function useOrganizationGalleryPresignProvider(organizationId: string): PresignProvider {
  const qc = useQueryClient();
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) =>
        organizationsApi.requestGalleryUploadUrl(organizationId, {
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        }),
      finalizeUpload: async (storageKey, file) => {
        await organizationsApi.addGalleryImage(organizationId, { storageKey, mimeType: file.mimeType });
        void qc.invalidateQueries({ queryKey: orgKeys.detail(organizationId) });
        void qc.invalidateQueries({ queryKey: orgKeys.lists() });
      },
    }),
    [organizationId, qc],
  );
}
