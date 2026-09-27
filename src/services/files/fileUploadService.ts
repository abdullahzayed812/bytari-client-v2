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

// Largest single upload the app attempts (chat videos). Each backend endpoint
// enforces its own, usually smaller, per-kind limit.
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

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

/** Read the local file once — its bytes are uploaded and its real size is declared. */
function readBlob(file: LocalFile): Promise<Blob> {
  return fetch(file.uri).then((r) => r.blob());
}

async function putBytes(
  presigned: PresignedUpload,
  file: LocalFile,
  options?: UploadOptions,
  blob?: Blob,
): Promise<number> {
  const body = blob ?? (await readBlob(file));
  const total = body.size || file.size || 0;
  options?.onProgress?.({ loaded: 0, total, fraction: 0 });

  const headers: Record<string, string> = { 'Content-Type': file.mimeType, ...presigned.headers };

  // XMLHttpRequest reports real upload progress (fetch cannot); fall back to
  // fetch where XHR is unavailable (tests / non-RN runtimes).
  if (typeof XMLHttpRequest !== 'undefined') {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(presigned.method, presigned.uploadUrl);
      for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return;
        options?.onProgress?.({ loaded: e.loaded, total: e.total, fraction: e.loaded / e.total });
      };
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new Error(`Upload failed with status ${xhr.status}`));
      xhr.onerror = () => reject(networkError(new Error('upload network error')));
      xhr.onabort = () => reject(new DOMException('Upload aborted', 'AbortError'));
      options?.signal?.addEventListener('abort', () => xhr.abort());
      xhr.send(body);
    });
  } else {
    let response: Response;
    try {
      response = await fetch(presigned.uploadUrl, {
        method: presigned.method,
        headers,
        body,
        signal: options?.signal,
      });
    } catch (error) {
      throw networkError(error);
    }
    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }
  }
  options?.onProgress?.({ loaded: total, total, fraction: 1 });
  return total;
}

export class FileUploadService {
  constructor(private readonly provider: PresignProvider) {}

  async upload(file: LocalFile, options?: UploadOptions): Promise<UploadResult> {
    // Pickers (notably on web) and edited images may not report a byte size,
    // but every presign endpoint requires one — measure the actual bytes.
    const blob = await readBlob(file);
    const sized: LocalFile = file.size && file.size > 0 ? file : { ...file, size: blob.size };
    assertUploadable(sized);
    const presigned = await this.provider.requestUpload(sized);
    const size = await putBytes(presigned, sized, options, blob);
    await this.provider.finalizeUpload?.(presigned.storageKey, sized);
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
