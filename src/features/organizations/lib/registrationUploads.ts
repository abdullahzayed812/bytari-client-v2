import { FileUploadService } from '@/services/files/fileUploadService';
import type { LocalFile, PresignProvider } from '@/services/files/types';

import { organizationsApi } from '../api';

/**
 * Registration screens ("تسجيل العيادة" / office registration) pick logo +
 * gallery + license-document photos locally FIRST (before the organization
 * exists — there is nothing to attach them to yet), then upload each one
 * right after `organizationsApi.create` succeeds. All three providers mirror
 * the presigned direct-to-storage seam used everywhere else in the app
 * (`@/services/media`); used imperatively here (a plain loop in the submit
 * handler), not through the single-slot `<ImageUploader>` component.
 */
function logoProvider(organizationId: string): PresignProvider {
  return {
    requestUpload: (file) =>
      organizationsApi.requestLogoUploadUrl(organizationId, {
        filename: file.name,
        mimeType: file.mimeType,
        size: file.size ?? 0,
      }),
    finalizeUpload: async (storageKey, file) => {
      await organizationsApi.finalizeLogo(organizationId, { storageKey, mimeType: file.mimeType });
    },
  };
}

function galleryProvider(organizationId: string): PresignProvider {
  return {
    requestUpload: (file) =>
      organizationsApi.requestGalleryUploadUrl(organizationId, {
        filename: file.name,
        mimeType: file.mimeType,
        size: file.size ?? 0,
      }),
    finalizeUpload: async (storageKey, file) => {
      await organizationsApi.addGalleryImage(organizationId, { storageKey, mimeType: file.mimeType });
    },
  };
}

function licenseDocumentProvider(organizationId: string): PresignProvider {
  return {
    requestUpload: (file) =>
      organizationsApi.requestLicenseDocumentUploadUrl(organizationId, {
        filename: file.name,
        mimeType: file.mimeType,
        size: file.size ?? 0,
      }),
    finalizeUpload: async (storageKey, file) => {
      await organizationsApi.addLicenseDocument(organizationId, {
        storageKey,
        mimeType: file.mimeType,
      });
    },
  };
}

/** Uploads every picked file sequentially (not parallel — clearer progress, gentler on the API). */
async function uploadAll(files: LocalFile[], provider: PresignProvider): Promise<void> {
  const service = new FileUploadService(provider);
  for (const file of files) {
     
    await service.upload(file);
  }
}

export async function uploadOrganizationLogo(organizationId: string, file: LocalFile): Promise<void> {
  const service = new FileUploadService(logoProvider(organizationId));
  await service.upload(file);
}

export async function uploadGalleryPhotos(organizationId: string, files: LocalFile[]): Promise<void> {
  await uploadAll(files, galleryProvider(organizationId));
}

export async function uploadLicenseDocuments(
  organizationId: string,
  files: LocalFile[],
): Promise<void> {
  await uploadAll(files, licenseDocumentProvider(organizationId));
}
