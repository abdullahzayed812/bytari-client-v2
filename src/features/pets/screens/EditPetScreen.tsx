import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { TextButton } from '@/components/actions';
import { ConfirmationDialog, ErrorState, Loading, useToast } from '@/components/feedback';
import { ImagePreview, ImageUploader } from '@/components/media';
import { Label } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';

import { PetForm, PetFormLayout } from '../components';
import {
  useAnimalGalleryPresignProvider,
  useDeactivatePet,
  usePet,
  useRemovePetGalleryImage,
  useUpdatePet,
} from '../hooks';
import type { UpdatePetInput } from '../types';
import { type PetFormValues } from '../validation/schemas';

const MAX_GALLERY_IMAGES = 8;

/** Route `/pets/[petId]/edit` — Edit Pet + archive (§8). Backend enforces ownership. */
export default function EditPetScreen() {
  const theme = useTheme();
  const { t } = useTranslation('pets');
  const toast = useToast();
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const q = usePet(petId);
  const update = useUpdatePet(petId ?? '');
  const deactivate = useDeactivatePet(petId ?? '');
  const galleryPresign = useAnimalGalleryPresignProvider(petId);
  const removeGalleryImage = useRemovePetGalleryImage(petId ?? '');

  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [galleryUploadKey, setGalleryUploadKey] = useState(0);

  if (q.isLoading) {
    return (
      <PetFormLayout title={t('form.editTitle')}>
        <Loading fill />
      </PetFormLayout>
    );
  }
  if (q.isError || !q.data) {
    const notFound = q.error instanceof ApiError && q.error.status === 404;
    return (
      <PetFormLayout title={t('form.editTitle')}>
        <ErrorState
          error={q.error}
          title={notFound ? t('detail.notFoundTitle') : undefined}
          onRetry={notFound ? undefined : () => void q.refetch()}
        />
      </PetFormLayout>
    );
  }

  const pet = q.data;
  const defaults: PetFormValues = {
    name: pet.name,
    species: pet.species,
    sex: pet.sex,
    breed: pet.breed ?? '',
    dateOfBirth: pet.dateOfBirth ?? '',
    notes: pet.notes ?? '',
  };

  const onSubmit = (values: PetFormValues) => {
    if (inFlight.current || update.isPending) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    // Profile fields only — never ownership/status. Empty optionals clear (null).
    const payload: UpdatePetInput = {
      name: values.name.trim(),
      species: values.species,
      sex: values.sex,
      breed: values.breed?.trim() ? values.breed.trim() : null,
      dateOfBirth: values.dateOfBirth?.trim() ? values.dateOfBirth.trim() : null,
      notes: values.notes?.trim() ? values.notes.trim() : null,
    };
    update.mutate(payload, {
      onSuccess: () => {
        toast.show({ tone: 'success', message: t('form.successEdit') });
        router.back();
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
    <PetFormLayout title={t('form.editTitle')}>
      <View style={{ rowGap: theme.spacing.xs, marginBottom: theme.spacing.md }}>
        <Label>{t('form.galleryLabel')}</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {(pet.galleryUrls ?? []).map((url, index) => {
            const key = pet.galleryKeys?.[index];
            return (
              <ImagePreview
                key={url}
                uri={url}
                size={88}
                onRemove={
                  key
                    ? () =>
                        removeGalleryImage.mutate(key, {
                          onError: (error) =>
                            toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
                        })
                    : undefined
                }
              />
            );
          })}
          {(pet.galleryUrls?.length ?? 0) < MAX_GALLERY_IMAGES ? (
            <ImageUploader
              key={galleryUploadKey}
              value={null}
              provider={galleryPresign}
              icon="add"
              size={88}
              onChange={(result) => {
                if (result) setGalleryUploadKey((k) => k + 1);
              }}
            />
          ) : null}
        </View>
      </View>

      <PetForm
        mode="edit"
        defaultValues={defaults}
        submitting={update.isPending}
        formError={formError}
        serverFields={serverFields}
        onSubmit={onSubmit}
      />

      {pet.status === 'ACTIVE' ? (
        <View style={{ marginTop: theme.spacing.xl, alignItems: 'center' }}>
          <TextButton
            label={t('actions.deactivate')}
            tone="danger"
            icon="archive-outline"
            disabled={deactivate.isPending}
            onPress={() => setConfirmArchive(true)}
          />
        </View>
      ) : null}

      <ConfirmationDialog
        visible={confirmArchive}
        title={t('actions.deactivateConfirmTitle')}
        message={t('actions.deactivateConfirmBody')}
        confirmLabel={t('actions.deactivate')}
        cancelLabel="إلغاء"
        destructive
        loading={deactivate.isPending}
        onConfirm={() => {
          setConfirmArchive(false);
          deactivate.mutate(undefined, {
            onSuccess: () => {
              toast.show({ tone: 'success', message: t('actions.deactivated') });
              router.replace(Routes.pets);
            },
            onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
          });
        }}
        onCancel={() => setConfirmArchive(false)}
      />
    </PetFormLayout>
  );
}
