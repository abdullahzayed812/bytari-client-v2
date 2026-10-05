import type { User } from '@/features/auth/types';
import { profileApi } from '@/features/registration/api/profileApi';
import { apiClient } from '@/services/api';
import { FileUploadService } from '@/services/files/fileUploadService';
import type { LocalFile, UploadResult } from '@/services/files/types';

/** `PATCH /users/me` body — the server's strict allow-list (no email / status / password). */
export interface UpdateMyProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  whatsapp?: string | null;
  country?: string | null;
  governorate?: string | null;
  specialization?: string | null;
  bio?: string | null;
}

export type MyDocumentKind =
  'LICENSE_OR_ID' | 'ADDITIONAL_ID' | 'STUDENT_ID_FRONT' | 'STUDENT_ID_BACK';

/** One of the caller's own verification documents — a short-lived signed view URL, never a key. */
export interface MyDocument {
  kind: MyDocumentKind;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  downloadUrl: string;
}

export interface MyDocuments {
  applicationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  documents: MyDocument[];
}

/**
 * The signed-in user's own profile:
 *   PATCH /users/me                    → updated public user
 *   GET   /veterinarians/me/documents  → own verification documents (read-only)
 *   POST  /users/me/avatar/upload-url + POST /users/me/avatar (via `profileApi`)
 */
export const accountApi = {
  updateMe(input: UpdateMyProfileInput): Promise<User> {
    return apiClient.patch<User>('/users/me', input);
  },

  myDocuments(): Promise<MyDocuments> {
    return apiClient.get<MyDocuments>('/veterinarians/me/documents');
  },

  /** Presign → direct upload → finalize; the server re-validates size and type. */
  uploadAvatar(file: LocalFile): Promise<UploadResult> {
    return new FileUploadService({
      requestUpload: (f) =>
        profileApi.requestAvatarUploadUrl({
          filename: f.name,
          mimeType: f.mimeType,
          size: f.size ?? 0,
        }),
      finalizeUpload: async (storageKey, f) => {
        await profileApi.finalizeAvatar({ storageKey, mimeType: f.mimeType, filename: f.name });
      },
    }).upload(file);
  },
};

export const accountKeys = {
  all: ['account'] as const,
  documents: () => [...accountKeys.all, 'documents'] as const,
};
