import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Icon } from '@/components/content';
import { Alert, EmptyState, useToast } from '@/components/feedback';
import { ImagePreview } from '@/components/media';
import { Label, Text } from '@/components/typography';
import { OrgFormLayout } from '@/features/organizations';
import { petsApi } from '@/features/pets/api/petsApi';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';
import { FileUploadService } from '@/services/files';
import type { PresignProvider } from '@/services/files/types';
import { isPermissionError, pickImages, type LocalFile } from '@/services/media';
import { useTheme } from '@/theme';

import { publicationsApi } from '../api';
import { AnimalProfileFields, PublicationListingFieldsForm } from '../components';
import { publicationKindFromSlug } from '../constants';
import { devNewAnimalPublicationDefaults } from '../data/devDefaults';
import type { CreatePublicationInput } from '../types';
import {
  buildAnimalProfileSchema,
  buildListingSchema,
  listingValuesToInput,
  publicationErrorMessage,
} from '../validation/schemas';

const TILE_SIZE = 84;

const EMPTY_DEFAULTS = {
  species: '',
  breed: '',
  name: '',
  sex: '',
  color: '',
  ageEstimate: '',
  distinguishingFeatures: '',
  note: '',
  extraNotes: '',
  contactName: '',
  contactPhone: '',
  city: '',
  lostDate: '',
  lostTime: '',
  lostGovernorate: '',
  lostDistrict: '',
  lostLocationDetail: '',
  healthNotes: '',
  healthStatus: '',
  vaccinationStatus: '',
  isSterilized: '',
};

// DEV-ONLY: pre-filled so the form doesn't need retyping on every test run.
const DEFAULT_VALUES = devDataEnabled
  ? { ...EMPTY_DEFAULTS, ...devNewAnimalPublicationDefaults() }
  : EMPTY_DEFAULTS;

/** Local, pre-upload photo staging — no `animalId` exists yet to upload against. */
function PhotoPicker({
  photos,
  onAdd,
  onRemove,
}: {
  photos: LocalFile[];
  onAdd: () => void;
  onRemove: (uri: string) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('publications');
  return (
    <View style={{ rowGap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
      <Label>{t('form.photoLabel')}</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
          {photos.map((file) => (
            <ImagePreview
              key={file.uri}
              uri={file.uri}
              size={TILE_SIZE}
              onRemove={() => onRemove(file.uri)}
            />
          ))}
          {photos.length < 8 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('form.photoLabel')}
              onPress={onAdd}
              style={{
                width: TILE_SIZE,
                height: TILE_SIZE,
                borderRadius: theme.radius.lg,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceAccent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="camera-outline" size="iconMd" color="primary" />
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
      <Text variant="caption" color="textMuted">
        {t('form.photoHint')}
      </Text>
    </View>
  );
}

/**
 * Route `/publications/[kind]/create` — "إضافة حيوان مفقود / للتبني / للتزاوج"
 * from Pets Landing → List. Unlike `PublishAnimalScreen` (an already
 * registered pet), this collects the full animal profile too and creates a
 * brand-new `Animal` (reusing `POST /animals` as-is) + its listing in one
 * submit: create animal → upload staged photos to it → create the
 * publication. The publication still starts PENDING like any other.
 */
export default function CreatePublicationScreen() {
  const theme = useTheme();
  const { t } = useTranslation('publications');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const { kind: kindSlug } = useLocalSearchParams<{ kind: string }>();
  const kind = publicationKindFromSlug(kindSlug);

  const [photos, setPhotos] = useState<LocalFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const inFlight = useRef(false);

  const profileSchema = buildAnimalProfileSchema(t);
  const listingSchema = kind ? buildListingSchema(t, kind) : null;
  const combinedSchema = listingSchema
    ? profileSchema.merge(listingSchema as never)
    : profileSchema;

  const { control, handleSubmit } = useForm<any>({
    resolver: zodResolver(combinedSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onTouched',
  });

  if (!kind) {
    return (
      <OrgFormLayout title={t('browse.unknownKind')}>
        <EmptyState icon="alert-circle-outline" title={t('browse.unknownKind')} />
      </OrgFormLayout>
    );
  }

  const addPhotos = async () => {
    if (photos.length >= 8) return;
    try {
      const files = await pickImages({ max: 8 - photos.length });
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

  const uploadPhotos = async (animalId: string): Promise<void> => {
    const provider: PresignProvider = {
      requestUpload: (file) =>
        petsApi.requestGalleryUploadUrl(animalId, {
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        }),
      finalizeUpload: async (storageKey, file) => {
        await petsApi.finalizeGalleryImage(animalId, { storageKey, mimeType: file.mimeType });
      },
    };
    const uploader = new FileUploadService(provider);
    for (const file of photos) {
      await uploader.upload(file);
    }
  };

  const onSubmit = handleSubmit(async (values: Record<string, unknown>) => {
    if (inFlight.current || submitting) return;
    inFlight.current = true;
    setSubmitting(true);
    setFormError(null);
    setServerFields({});

    try {
      const animal = await petsApi.create({
        name: (values.name as string)?.trim() || t('form.unnamedAnimal'),
        species: values.species as never,
        breed: (values.breed as string)?.trim() || undefined,
        sex: (values.sex as string) || undefined,
        color: (values.color as string)?.trim() || undefined,
        ageEstimate: (values.ageEstimate as string) || undefined,
        distinguishingFeatures: (values.distinguishingFeatures as string)?.trim() || undefined,
      } as never);

      if (photos.length > 0) {
        try {
          await uploadPhotos(animal.id);
        } catch (photoError) {
          toast.show({ message: apiErrorMessage(photoError), tone: 'warning' });
        }
      }

      const input: CreatePublicationInput = listingValuesToInput(kind, values);
      await publicationsApi.create(animal.id, input);

      toast.show({ tone: 'success', message: t('form.success') });
      router.back();
    } catch (error) {
      setServerFields(fieldErrors(error));
      setFormError(publicationErrorMessage(error, t));
    } finally {
      setSubmitting(false);
      inFlight.current = false;
    }
  });

  return (
    <OrgFormLayout title={t(`form.createTitle.${kind}`)}>
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <PhotoPicker photos={photos} onAdd={() => void addPhotos()} onRemove={removePhoto} />

      <View style={{ rowGap: 4, marginBottom: theme.spacing.sm }}>
        <Label>{t('form.initialDataTitle')}</Label>
        <Text variant="caption" color="textMuted">
          {t('form.initialDataHint')}
        </Text>
      </View>
      <AnimalProfileFields control={control} serverFields={serverFields} />
      <PublicationListingFieldsForm kind={kind} control={control} serverFields={serverFields} />

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={t(`form.submit.${kind}`)}
          fullWidth
          loading={submitting}
          disabled={submitting}
          onPress={() => void onSubmit()}
          accessibilityLabel={t(`form.submit.${kind}`)}
        />
      </View>
    </OrgFormLayout>
  );
}
