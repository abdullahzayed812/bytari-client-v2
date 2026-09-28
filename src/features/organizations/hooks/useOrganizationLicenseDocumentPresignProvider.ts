import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { PresignProvider } from '@/services/files/types';

import { orgKeys, organizationsApi } from '../api';

/**
 * `PresignProvider` for an organization's license documents ("صور الترخيص") —
 * CLINIC / VETERINARY_OFFICE only. Mirrors `useOrganizationGalleryPresignProvider`.
 * With `replacesStorageKey` the upload swaps that document in place (the
 * server allows it even when the 3-document cap is reached).
 */
export function useOrganizationLicenseDocumentPresignProvider(
  organizationId: string,
  replacesStorageKey?: string,
): PresignProvider {
  const qc = useQueryClient();
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) =>
        organizationsApi.requestLicenseDocumentUploadUrl(organizationId, {
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
          ...(replacesStorageKey ? { replacesStorageKey } : {}),
        }),
      finalizeUpload: async (storageKey, file) => {
        await organizationsApi.addLicenseDocument(organizationId, {
          storageKey,
          mimeType: file.mimeType,
          ...(replacesStorageKey ? { replacesStorageKey } : {}),
        });
        void qc.invalidateQueries({ queryKey: orgKeys.detail(organizationId) });
        void qc.invalidateQueries({ queryKey: orgKeys.lists() });
      },
    }),
    [organizationId, replacesStorageKey, qc],
  );
}
