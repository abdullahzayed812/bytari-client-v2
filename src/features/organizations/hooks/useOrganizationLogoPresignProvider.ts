import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { PresignProvider } from '@/services/files/types';

import { orgKeys, organizationsApi } from '../api';

/**
 * `PresignProvider` for an organization's logo — the uploader requests a
 * presigned URL, `PUT`s the bytes straight to R2, then this finalizes it
 * (replacing any previous logo server-side). Mirrors
 * `useVeterinaryOfficeProductImagePresignProvider`.
 */
export function useOrganizationLogoPresignProvider(organizationId: string): PresignProvider {
  const qc = useQueryClient();
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) =>
        organizationsApi.requestLogoUploadUrl(organizationId, {
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        }),
      finalizeUpload: async (storageKey, file) => {
        await organizationsApi.finalizeLogo(organizationId, { storageKey, mimeType: file.mimeType });
        void qc.invalidateQueries({ queryKey: orgKeys.detail(organizationId) });
        void qc.invalidateQueries({ queryKey: orgKeys.lists() });
      },
    }),
    [organizationId, qc],
  );
}
