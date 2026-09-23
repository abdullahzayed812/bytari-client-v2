import { apiClient } from '@/services/api';
import type { PresignedUpload } from '@/services/files/types';

/**
 * `/api/v1/users/me/avatar*` — authenticated profile-photo upload. Used by the
 * Pet Owner / Veterinarian registration screens' optional photo picker.
 *
 *   POST /users/me/avatar/upload-url  body `{ filename, mimeType, size }`
 *                                      → presigned direct-upload URL
 *   POST /users/me/avatar             body `{ storageKey, mimeType, filename }`
 *                                      → 200 updated public user (sets the avatar)
 *
 * NOTE: both endpoints require an authenticated session. During the
 * registration screens the photo is picked LOCALLY, *before* the account
 * exists (`LocalImageUploader`), and only uploaded through these two calls
 * right after `register()` succeeds — see `uploadRegistrationAvatar`
 * (`../lib/deferredUploads.ts`), which is what actually calls them.
 */
export interface RequestAvatarUploadUrlInput {
  filename: string;
  mimeType: string;
  size: number;
}

export interface FinalizeAvatarInput {
  storageKey: string;
  mimeType: string;
  filename: string;
}

export const profileApi = {
  requestAvatarUploadUrl(input: RequestAvatarUploadUrlInput): Promise<PresignedUpload> {
    return apiClient.post<PresignedUpload>('/users/me/avatar/upload-url', input);
  },

  finalizeAvatar(input: FinalizeAvatarInput): Promise<unknown> {
    return apiClient.post('/users/me/avatar', input);
  },
};

export type ProfileApi = typeof profileApi;
