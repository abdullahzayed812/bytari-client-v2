import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useToast } from '@/components/feedback';
import { Routes } from '@/constants/routes';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';
import { uploadToPresignedUrl } from '@/services/files';
import { isPermissionError, pickImages, type LocalFile } from '@/services/media';
import { useTheme } from '@/theme';

import { petKeys, petsApi } from '../api';
import { PetForm, PetFormLayout, PetPhotoPicker } from '../components';
import { devPetDefaults } from '../data/devDefaults';
import { useCreatePet } from '../hooks';
import type { Pet } from '../types';
import { toCreateInput, type PetFormValues } from '../validation/schemas';

const MAX_PHOTOS = 8;

/** Route `/pets/create` — Add Pet (§7). Owner is derived by the backend from the JWT. */
export default function AddPetScreen() {
  const theme = useTheme();
  const { t } = useTranslation('pets');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const qc = useQueryClient();
  const create = useCreatePet();
  const inFlight = useRef(false);
  const [photos, setPhotos] = useState<LocalFile[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  const addPhotos = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    try {
      const files = await pickImages({ max: MAX_PHOTOS - photos.length });
      setPhotos((prev) => [...prev, ...files]);
    } catch (error) {
      if (isPermissionError(error)) {
        toast.show({ message: tc('media.permissionBody'), tone: 'warning' });
      } else {
        toast.show({ message: apiErrorMessage(error), tone: 'danger' });
      }
    }
  };
  const removePhoto = (uri: string) => setPhotos((prev) => prev.filter((f) => f.uri !== uri));

  const uploadPhotos = async (petId: string): Promise<Pet | null> => {
    let last: Pet | null = null;
    for (const file of photos) {
      const presigned = await petsApi.requestGalleryUploadUrl(petId, {
        filename: file.name,
        mimeType: file.mimeType,
        size: file.size ?? 0,
      });
      await uploadToPresignedUrl(presigned, file);
      last = await petsApi.finalizeGalleryImage(petId, {
        storageKey: presigned.storageKey,
        mimeType: file.mimeType,
      });
    }
    return last;
  };

  const onSubmit = (values: PetFormValues) => {
    if (inFlight.current || create.isPending) return; // synchronous duplicate-submit guard
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    create.mutate(toCreateInput(values), {
      onSuccess: async (pet) => {
        if (photos.length > 0) {
          try {
            const updated = await uploadPhotos(pet.id);
            if (updated) qc.setQueryData(petKeys.detail(pet.id), updated);
          } catch (photoError) {
            toast.show({ message: apiErrorMessage(photoError), tone: 'warning' });
          }
        }
        toast.show({ tone: 'success', message: t('form.successAdd') });
        router.replace(Routes.petDetail(pet.id));
      },
      onError: (error) => {
        setServerFields(fieldErrors(error));
        setFormError(apiErrorMessage(error));
      },
      onSettled: () => {
        inFlight.current = false;
      },
    });
  };

  return (
    <PetFormLayout title={t('form.addTitle')}>
      <View style={{ marginBottom: theme.spacing.md }}>
        <PetPhotoPicker photos={photos} onAdd={() => void addPhotos()} onRemove={removePhoto} />
      </View>
      <PetForm
        mode="add"
        defaultValues={devDataEnabled ? devPetDefaults() : undefined}
        submitting={create.isPending}
        formError={formError}
        serverFields={serverFields}
        onSubmit={onSubmit}
      />
    </PetFormLayout>
  );
}
