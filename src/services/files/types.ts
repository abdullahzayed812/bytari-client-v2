export interface LocalFile {
  /** `file://` URI from image picker / document picker. */
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

/**
 * Response shape the backend returns when asked for a direct-upload URL.
 * Mirrors the Phase-14 content upload contract
 * (`server` → `requestUploadUrl`): the server owns `storageKey`.
 */
export interface PresignedUpload {
  storageKey: string;
  uploadUrl: string;
  method: 'PUT' | 'POST';
  headers: Record<string, string>;
  expiresInSeconds: number;
}

export interface UploadResult {
  storageKey: string;
  /** Bytes transferred. */
  size: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  fraction: number;
}

/**
 * A feature module supplies one of these to obtain a presigned URL from its own
 * backend endpoint (e.g. animal photos, profile pictures, documents). Phase 1
 * has no such endpoint wired — this is the seam.
 */
export interface PresignProvider {
  requestUpload(file: LocalFile): Promise<PresignedUpload>;
  /** Optional: confirm the upload with the backend so it records the file. */
  finalizeUpload?(storageKey: string, file: LocalFile): Promise<void>;
}

export type UploadPurpose = 'avatar' | 'animalPhoto' | 'document' | 'attachment' | 'contentMedia';
