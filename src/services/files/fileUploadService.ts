import { createLogger } from '@/lib/logger';
import { networkError } from '@/services/api';

import type {
  LocalFile,
  PresignProvider,
  PresignedUpload,
  UploadProgress,
  UploadResult,
} from './types';

/**
 * Client-side file upload abstraction.
 *
 * SECURITY: the mobile app holds NO Cloudflare R2 credentials — no access key,
 * no secret, no bucket policy. The only thing it ever does is:
 *   1. ask the backend for a short-lived presigned URL (via a `PresignProvider`);
 *   2. `PUT` the file bytes straight to that URL;
 *   3. optionally tell the backend the upload finished.
 *
 * Phase 1 ships this abstraction + the generic transfer. No business
 * `PresignProvider` is wired yet — feature phases (animal photos, avatars,
 * documents) implement one against their own backend endpoint.
 */
const log = createLogger('file-upload');

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const ALLOWED_MIME_PREFIXES = ['image/', 'application/pdf', 'video/', 'audio/'];

function assertUploadable(file: LocalFile): void {
  if (file.size !== undefined && file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File is too large (max ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB).`);
  }
  const ok = ALLOWED_MIME_PREFIXES.some((p) => file.mimeType.startsWith(p));
  if (!ok) {
    // Content type is validated authoritatively by the backend on finalize; this
    // is an early client-side guard only.
    log.warn('unexpected mime type', { mimeType: file.mimeType });
  }
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

async function putBytes(
  presigned: PresignedUpload,
  file: LocalFile,
  options?: UploadOptions,
): Promise<number> {
  const body = await fetch(file.uri).then((r) => r.blob());
  const total = body.size || file.size || 0;
  options?.onProgress?.({ loaded: 0, total, fraction: 0 });

  let response: Response;
  try {
    response = await fetch(presigned.uploadUrl, {
      method: presigned.method,
      headers: { 'Content-Type': file.mimeType, ...presigned.headers },
      body,
      signal: options?.signal,
    });
  } catch (error) {
    throw networkError(error);
  }

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }
  options?.onProgress?.({ loaded: total, total, fraction: 1 });
  return total;
}

export class FileUploadService {
  constructor(private readonly provider: PresignProvider) {}

  async upload(file: LocalFile, options?: UploadOptions): Promise<UploadResult> {
    assertUploadable(file);
    const presigned = await this.provider.requestUpload(file);
    const size = await putBytes(presigned, file, options);
    await this.provider.finalizeUpload?.(presigned.storageKey, file);
    log.info('upload complete', { storageKey: presigned.storageKey, size });
    return { storageKey: presigned.storageKey, size };
  }
}

/** Transfer to an already-obtained presigned URL. Useful for retry / advanced flows. */
export async function uploadToPresignedUrl(
  presigned: PresignedUpload,
  file: LocalFile,
  options?: UploadOptions,
): Promise<UploadResult> {
  assertUploadable(file);
  const size = await putBytes(presigned, file, options);
  return { storageKey: presigned.storageKey, size };
}

export { MAX_UPLOAD_BYTES };
