import { useCallback, useRef, useState } from 'react';

import { FileUploadService, type UploadOptions } from '@/services/files/fileUploadService';
import type { LocalFile, PresignProvider, UploadResult } from '@/services/files/types';

export type MediaUploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface MediaUploadState {
  status: MediaUploadStatus;
  /** 0–1. */
  progress: number;
  result: UploadResult | null;
  error: unknown;
  /** The local file currently selected / uploading (for optimistic preview). */
  file: LocalFile | null;
}

export interface UseMediaUpload extends MediaUploadState {
  /** Upload an already-picked local file through the presign flow. */
  upload: (file: LocalFile) => Promise<UploadResult | null>;
  /** Abort an in-flight upload. */
  cancel: () => void;
  /** Clear state back to idle (keeps nothing). */
  reset: () => void;
}

/**
 * Drives one presigned upload against the backend's secure flow. The mobile app
 * NEVER holds R2 credentials — `provider` asks the backend for a short-lived URL,
 * we `PUT` the bytes, then optionally finalize. Progress is best-effort (RN
 * `fetch` has no upload-progress event; the service reports 0 → 1).
 */
export function useMediaUpload(provider: PresignProvider): UseMediaUpload {
  const [state, setState] = useState<MediaUploadState>({
    status: 'idle',
    progress: 0,
    result: null,
    error: null,
    file: null,
  });
  const abortRef = useRef<AbortController | null>(null);
  const serviceRef = useRef<FileUploadService | null>(null);
  if (!serviceRef.current) serviceRef.current = new FileUploadService(provider);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState({ status: 'idle', progress: 0, result: null, error: null, file: null });
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((s) => (s.status === 'uploading' ? { ...s, status: 'idle', progress: 0 } : s));
  }, []);

  const upload = useCallback(async (file: LocalFile): Promise<UploadResult | null> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: 'uploading', progress: 0, result: null, error: null, file });

    const opts: UploadOptions = {
      signal: controller.signal,
      onProgress: ({ fraction }) =>
        setState((s) => (s.status === 'uploading' ? { ...s, progress: fraction } : s)),
    };

    try {
      const result = await serviceRef.current!.upload(file, opts);
      setState({ status: 'success', progress: 1, result, error: null, file });
      return result;
    } catch (error) {
      if (controller.signal.aborted) {
        setState({ status: 'idle', progress: 0, result: null, error: null, file: null });
        return null;
      }
      setState({ status: 'error', progress: 0, result: null, error, file });
      return null;
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, []);

  return { ...state, upload, cancel, reset };
}
