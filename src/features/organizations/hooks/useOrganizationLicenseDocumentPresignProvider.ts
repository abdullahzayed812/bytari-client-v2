import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { PresignProvider } from '@/services/files/types';

import { orgKeys, organizationsApi } from '../api';

/**
 * `PresignProvider` for an organization's license documents ("صور الترخيص") —
 * CLINIC / VETERINARY_OFFICE only. Mirrors `useOrganizationGalleryPresignProvider`.
 */
export function useOrganizationLicenseDocumentPresignProvider(
  organizationId: string,
): PresignProvider {
  const qc = useQueryClient();
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) =>
        organizationsApi.requestLicenseDocumentUploadUrl(organizationId, {
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        }),
      finalizeUpload: async (storageKey, file) => {
        await organizationsApi.addLicenseDocument(organizationId, {
          storageKey,
          mimeType: file.mimeType,
        });
        void qc.invalidateQueries({ queryKey: orgKeys.detail(organizationId) });
        void qc.invalidateQueries({ queryKey: orgKeys.lists() });
      },
    }),
    [organizationId, qc],
  );
}
