import { useMemo } from 'react';

import type { PresignProvider } from '@/services/files/types';

import { profileApi } from '../api/profileApi';

/**
 * `PresignProvider` for the optional profile-photo picker on the registration
 * screens. Plugs straight into `ImageUploader` — it requests a presigned URL,
 * the uploader `PUT`s the bytes, then this finalizes the avatar server-side.
 *
 * NOTE: `/users/me/avatar*` is authenticated. On the registration screens the
 * photo is picked before the account exists, so a pick attempted before
 * `register()` succeeds will 401 — `ImageUploader` surfaces that as a
 * non-blocking toast (the photo stays optional either way).
 */
export function useAvatarPresignProvider(): PresignProvider {
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) =>
        profileApi.requestAvatarUploadUrl({
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        }),
      finalizeUpload: async (storageKey, file) => {
        await profileApi.finalizeAvatar({
          storageKey,
          mimeType: file.mimeType,
          filename: file.name,
        });
      },
    }),
    [],
  );
}
