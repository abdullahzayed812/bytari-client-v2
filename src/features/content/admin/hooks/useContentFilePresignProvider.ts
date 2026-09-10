import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { PresignProvider } from '@/services/files/types';

import { contentKeys } from '../../api';
import type { ContentFileKind } from '../../types';
import { adminContentApi, adminContentKeys } from '../api';

/**
 * `PresignProvider` for one content item's COVER / MAIN / ATTACHMENT file.
 * The uploader requests a presigned URL, `PUT`s the bytes straight to R2,
 * then this registers the file on the content (replacing any existing
 * COVER/MAIN — `content.repository`'s partial unique index keeps at most one
 * live file per kind). Storage credentials never touch the app.
 */
export function useContentFilePresignProvider(
  contentId: string | undefined,
  kind: ContentFileKind,
): PresignProvider {
  const qc = useQueryClient();
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) => {
        if (!contentId) throw new Error('contentId is required');
        return adminContentApi.requestUploadUrl(contentId, {
          kind,
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        });
      },
      finalizeUpload: async (storageKey, file) => {
        if (!contentId) throw new Error('contentId is required');
        await adminContentApi.registerFile(contentId, {
          storageKey,
          kind,
          filename: file.name,
          mimeType: file.mimeType,
        });
        void qc.invalidateQueries({ queryKey: adminContentKeys.detail(contentId) });
        void qc.invalidateQueries({ queryKey: contentKeys.detail(contentId) });
      },
    }),
    [contentId, kind, qc],
  );
}
