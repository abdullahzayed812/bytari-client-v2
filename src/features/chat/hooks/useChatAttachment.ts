import { getInfoAsync } from 'expo-file-system';
import { useMemo } from 'react';

import type { PresignProvider } from '@/services/files/types';
import { useMediaUpload, type LocalFile } from '@/services/media';

import { chatApi } from '../api';
import { attachmentKindFor } from '../types';

/** The picker may omit the byte size — the presign endpoint needs it. */
export async function withFileSize(file: LocalFile): Promise<LocalFile> {
  if (file.size && file.size > 0) return file;
  const info = await getInfoAsync(file.uri);
  return info.exists && typeof info.size === 'number' ? { ...file, size: info.size } : file;
}

/**
 * One chat attachment upload for a conversation — the shared presigned-R2
 * flow (`useMediaUpload`) pointed at `POST /conversations/:id/attachments/upload-url`.
 * The kind (IMAGE / VIDEO / FILE) follows the file's MIME type; the server
 * re-validates type (magic bytes), size and conversation access.
 */
export function useChatAttachmentUpload(conversationId: string) {
  const provider = useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) =>
        chatApi.requestAttachmentUpload(conversationId, {
          kind: attachmentKindFor(file.mimeType),
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        }),
    }),
    [conversationId],
  );
  return useMediaUpload(provider);
}
