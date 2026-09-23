import { FileUploadService } from '@/services/files/fileUploadService';
import type { LocalFile, PresignProvider, UploadResult } from '@/services/files/types';
import { profileApi } from '../api/profileApi';
import { veterinarianApi } from '@/features/veterinarian';
import type { VeterinarianDocumentKind } from '@/features/veterinarian';

/**
 * Registration screens (`PetOwnerRegisterScreen`, `VeterinarianRegisterScreen`)
 * pick the avatar — and, for a veterinarian applicant, identity documents —
 * locally FIRST (before `register()` has run, so there is nothing to attach
 * them to yet, and no session to authenticate the upload with either), via
 * `LocalImageUploader`, then upload each one right after `register()`
 * succeeds (its token, though scoped to a `PENDING_VERIFICATION` account, is
 * allowlisted for exactly these calls — see the backend's
 * `authenticate.middleware.ts`). Mirrors
 * `@/features/organizations/lib/registrationUploads.ts`'s exact pattern for
 * organization registration (logo / gallery / license documents); used
 * imperatively in the submit handler, not through a component.
 */

/** `PresignProvider` for the registration-time avatar — reuses the SAME `/users/me/avatar/*` endpoints the in-app profile-photo picker uses. */
function avatarProvider(): PresignProvider {
  return {
    requestUpload: (file) =>
      profileApi.requestAvatarUploadUrl({
        filename: file.name,
        mimeType: file.mimeType,
        size: file.size ?? 0,
      }),
    finalizeUpload: async (storageKey, file) => {
      await profileApi.finalizeAvatar({ storageKey, mimeType: file.mimeType, filename: file.name });
    },
  };
}

/** Upload the picked avatar. A failure here is deliberately non-fatal to the caller — see `PetOwnerRegisterScreen`/`VeterinarianRegisterScreen`'s try/catch around this call. */
export async function uploadRegistrationAvatar(file: LocalFile): Promise<UploadResult> {
  return new FileUploadService(avatarProvider()).upload(file);
}

/** `PresignProvider` for one veterinarian-application document slot — no `finalizeUpload`; the key is only persisted once, batched into `apply()`'s `documents[]`. */
function documentProvider(kind: VeterinarianDocumentKind): PresignProvider {
  return {
    requestUpload: (file) =>
      veterinarianApi.requestDocumentUploadUrl({
        kind,
        filename: file.name,
        mimeType: file.mimeType,
        size: file.size ?? 0,
      }),
  };
}

export interface UploadedVeterinarianDocument {
  kind: VeterinarianDocumentKind;
  storageKey: string;
  filename: string;
  mimeType: string;
}

/** Upload one staged veterinarian-application document, returning the `{kind, storageKey, filename, mimeType}` ref `apply()` needs. */
export async function uploadRegistrationDocument(
  kind: VeterinarianDocumentKind,
  file: LocalFile,
): Promise<UploadedVeterinarianDocument> {
  const result = await new FileUploadService(documentProvider(kind)).upload(file);
  return { kind, storageKey: result.storageKey, filename: file.name, mimeType: file.mimeType };
}
