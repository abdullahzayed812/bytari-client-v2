import { useMemo } from 'react';

import type { PresignProvider } from '@/services/files/types';

import { petsApi } from '../api/petsApi';

/**
 * `PresignProvider` for an animal's photo gallery (up to 8 photos) — the Add
 * Lost / Adoption / Mating Animal forms. Requests a presigned URL, the
 * uploader `PUT`s the bytes, then this registers the photo on the animal.
 */
export function useAnimalGalleryPresignProvider(petId: string | undefined): PresignProvider {
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file) => {
        if (!petId) throw new Error('useAnimalGalleryPresignProvider: petId is required');
        return petsApi.requestGalleryUploadUrl(petId, {
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        });
      },
      finalizeUpload: async (storageKey, file) => {
        if (!petId) throw new Error('useAnimalGalleryPresignProvider: petId is required');
        await petsApi.finalizeGalleryImage(petId, { storageKey, mimeType: file.mimeType });
      },
    }),
    [petId],
  );
}
