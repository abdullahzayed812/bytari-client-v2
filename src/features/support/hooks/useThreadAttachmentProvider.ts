import { useMemo } from 'react';

import type { LocalFile, PresignProvider } from '@/services/media';

import { threadApi } from '../api';
import type { ThreadKind } from '../types';

/**
 * `PresignProvider` for a thread message photo (CONSULTATION / INQUIRY / SUPPORT,
 * first message or reply).
 *
 * There is no `finalizeUpload`: the upload is "confirmed" by passing the
 * returned `storageKey` in the create / send call's `imageKeys` — which is where the backend re-checks the object's real size and
 * MIME via `storage.head()` before persisting it. Mirrors
 * `useSyndicateMediaProvider`.
 */
export function useThreadAttachmentProvider(kind: ThreadKind): PresignProvider {
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file: LocalFile) =>
        threadApi(kind).requestAttachmentUploadUrl({
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        }),
    }),
    [kind],
  );
}
