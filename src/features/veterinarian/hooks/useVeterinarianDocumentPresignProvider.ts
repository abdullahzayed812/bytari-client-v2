import { useCallback, useMemo, useRef } from 'react';

import type { LocalFile, PresignProvider, UploadResult } from '@/services/files/types';

import { veterinarianApi } from '../api';
import type { VeterinarianDocumentKind } from '../types';

/** A completed presigned upload for one document slot. */
export interface VeterinarianDocumentRef {
  storageKey: string;
  filename: string;
  mimeType: string;
}

export interface UseVeterinarianDocumentPresignProvider {
  provider: PresignProvider;
  /**
   * Build the `{storageKey, filename, mimeType}` the apply payload needs from
   * an `ImageUploader` upload result. `ImageUploader.onChange` only carries the
   * `UploadResult` (storageKey + size) — the picked file's name/mime are
   * captured here (from the just-completed `requestUpload` call).
   */
  toDocumentRef: (result: UploadResult) => VeterinarianDocumentRef | null;
}

/**
 * `PresignProvider` for one veterinarian-application document slot
 * (`POST /veterinarians/documents/upload-url`). Deliberately has NO
 * `finalizeUpload` — there is no per-document backend register call; the
 * resulting `storageKey` is only persisted once, batched into the
 * `documents[]` array of the final `POST /veterinarians/apply` call. Used by
 * both the in-app re-apply screen and the registration-time application flow.
 */
export function useVeterinarianDocumentPresignProvider(
  kind: VeterinarianDocumentKind,
): UseVeterinarianDocumentPresignProvider {
  const lastFileRef = useRef<LocalFile | null>(null);

  const provider = useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) => {
        lastFileRef.current = file;
        return veterinarianApi.requestDocumentUploadUrl({
          kind,
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        });
      },
    }),
    [kind],
  );

  const toDocumentRef = useCallback((result: UploadResult): VeterinarianDocumentRef | null => {
    const file = lastFileRef.current;
    if (!file) return null;
    return { storageKey: result.storageKey, filename: file.name, mimeType: file.mimeType };
  }, []);

  return { provider, toDocumentRef };
}
