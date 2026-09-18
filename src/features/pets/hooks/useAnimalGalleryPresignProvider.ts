import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { PresignProvider } from '@/services/files/types';

import { petKeys, petsApi } from '../api';

/**
 * `PresignProvider` for an animal's photo gallery (up to 8 photos) — used by
 * the Add Lost/Adoption/Mating Animal form and the Edit Pet screen. Requests
 * a presigned URL, the uploader `PUT`s the bytes, then this registers the
 * photo on the animal and refreshes the pet's cached detail/list so the new
 * photo shows up immediately.
 */
export function useAnimalGalleryPresignProvider(petId: string | undefined): PresignProvider {
  const qc = useQueryClient();
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
        const pet = await petsApi.finalizeGalleryImage(petId, { storageKey, mimeType: file.mimeType });
        qc.setQueryData(petKeys.detail(petId), pet);
        void qc.invalidateQueries({ queryKey: petKeys.lists() });
      },
    }),
    [petId, qc],
  );
}
