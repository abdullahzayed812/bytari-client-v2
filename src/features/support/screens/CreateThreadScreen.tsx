import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Chip } from '@/components/content';
import { Alert, useToast } from '@/components/feedback';
import { FormField, Select } from '@/components/forms';
import { MultiImagePicker } from '@/components/media';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { OrgFormLayout } from '@/features/organizations';
import { usePets } from '@/features/pets';
import { useCapabilities } from '@/hooks';
import { fieldErrors } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';
import { useTheme } from '@/theme';

import { SUPPORT_KIND_META, kindFromSlug } from '../constants';
import { useCreateThread, useThreadAttachmentProvider } from '../hooks';
import {
  CONSULTATION_ANIMAL_TYPES,
  INQUIRY_CATEGORIES,
  MAX_THREAD_IMAGES,
  type ConsultationAnimalType,
  type InquiryCategory,
} from '../types';
import {
  buildConsultationSchema,
  buildInquirySchema,
  buildMessageSchema,
  supportErrorMessage,
} from '../validation/schemas';

/** One form shape for every kind; each kind's schema validates only its own fields. */
interface CreateThreadFormValues {
  body: string;
  animalId?: string;
  animalType?: ConsultationAnimalType;
  category?: InquiryCategory;
}

/** Owned-pet species → the consultation animal-type vocabulary (unknown → OTHER). */
function speciesToAnimalType(species: string): ConsultationAnimalType {
  return (CONSULTATION_ANIMAL_TYPES as readonly string[]).includes(species)
    ? (species as ConsultationAnimalType)
    : 'OTHER';
}

/**
 * Route `/support/[kind]/create`. Consultation: message + an animal TYPE (any
 * animal — the user is not restricted to their registered pets) + an OPTIONAL
 * owned animal (backend rejects an animal you don't own; picking one fills in
 * its type). Inquiry: message + category, APPROVED vets only (backend
 * authoritative; the client only shows a hint). Support: message only.
 *
 * Both kinds accept up to `MAX_THREAD_IMAGES` photos on the first message —
 * each is presigned and uploaded to R2 as it is picked, and only its
 * `storageKey` is submitted. SUPPORT ("تواصل معنا") has no attachment
 * capability on the backend, so the section is hidden for it.
 */
export default function CreateThreadScreen() {
  const theme = useTheme();
  const { t } = useTranslation('support');
  const toast = useToast();
  const caps = useCapabilities();
  const { kind: slug } = useLocalSearchParams<{ kind: string }>();
  const kind = kindFromSlug(slug) ?? 'CONSULTATION';
  const meta = SUPPORT_KIND_META[kind];
  const isConsultation = kind === 'CONSULTATION';
  const isInquiry = kind === 'INQUIRY';
  const { t: tVs } = useTranslation('vetServices');

  const schema = useMemo(
    () =>
      isConsultation
        ? buildConsultationSchema(t)
        : isInquiry
          ? buildInquirySchema(t)
          : buildMessageSchema(t),
    [isConsultation, isInquiry, t],
  );
  const { control, handleSubmit, setValue } = useForm<CreateThreadFormValues>({
    resolver: zodResolver(schema),
    // DEV-ONLY: pre-filled so the form doesn't need retyping on every test run.
    defaultValues: {
      body: devDataEnabled ? 'استشارة تجريبية لأغراض الاختبار خلال مرحلة التطوير' : '',
      animalId: '',
      animalType: undefined,
      category: undefined,
    },
    mode: 'onTouched',
  });

  const create = useCreateThread(kind);
  const pets = usePets({ pageSize: 50, enabled: isConsultation });
  const attachmentProvider = useThreadAttachmentProvider(kind);
  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const [imageKeys, setImageKeys] = useState<string[]>([]);

  const supportsAttachments = kind !== 'SUPPORT';

  const blockedByVetGate =
    meta.createRequiresApprovedVet && !caps.isApprovedVeterinarian && !caps.isAdmin;

  const onSubmit = (values: CreateThreadFormValues) => {
    if (inFlight.current || create.isPending) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    const attachments = supportsAttachments && imageKeys.length > 0 ? imageKeys : undefined;
    const payload = isConsultation
      ? {
          body: values.body.trim(),
          animalId: values.animalId?.trim() || undefined,
          animalType: values.animalType,
          imageKeys: attachments,
        }
      : isInquiry
        ? {
            body: values.body.trim(),
            category: values.category ?? 'GENERAL',
            imageKeys: attachments,
          }
        : { body: values.body.trim() };
    create.mutate(payload, {
      onSuccess: (thread) => {
        toast.show({ tone: 'success', message: t('form.success') });
        router.replace(Routes.supportThread(meta.slug, thread.id));
      },
      onError: (error) => {
        setServerFields(fieldErrors(error));
        setFormError(supportErrorMessage(error, t));
      },
      onSettled: () => {
        inFlight.current = false;
      },
    });
  };

  return (
    <OrgFormLayout title={t(`form.title.${kind}`)}>
      <Caption>{t(`form.intro.${kind}`)}</Caption>

      {blockedByVetGate ? <Alert tone="warning" message={t('form.vetGate')} /> : null}
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <FormField
        control={control}
        name="body"
        label={t('form.bodyLabel')}
        placeholder={t(`form.bodyPlaceholder.${kind}`)}
        multiline
        numberOfLines={6}
        serverError={serverFields.body}
      />

      {isConsultation ? (
        <Controller
          control={control}
          name="animalType"
          render={({ field: { value, onChange }, fieldState }) => (
            <View style={{ rowGap: theme.spacing.xs }}>
              <Label>
                {t('form.animalTypeLabel')}
                <Text color="danger"> *</Text>
              </Label>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                {CONSULTATION_ANIMAL_TYPES.map((type) => (
                  <Chip
                    key={type}
                    label={tVs(`animalType.${type}`)}
                    selected={value === type}
                    onPress={() => onChange(type)}
                  />
                ))}
              </View>
              {fieldState.error?.message || serverFields.animalType ? (
                <Caption color="danger">
                  {fieldState.error?.message ?? serverFields.animalType}
                </Caption>
              ) : null}
            </View>
          )}
        />
      ) : null}

      {isConsultation && (pets.pets?.length ?? 0) > 0 ? (
        <Controller
          control={control}
          name="animalId"
          render={({ field: { value, onChange }, fieldState }) => (
            <Select<string>
              label={t('form.animalLabel')}
              placeholder={t('form.animalPlaceholder')}
              value={value ?? null}
              options={[
                { value: '', label: t('form.animalNone') },
                ...(pets.pets ?? []).map((p) => ({ value: p.id, label: p.name })),
              ]}
              onChange={(id) => {
                onChange(id);
                const pet = pets.pets?.find((p) => p.id === id);
                if (pet) {
                  setValue('animalType', speciesToAnimalType(pet.species), {
                    shouldValidate: true,
                  });
                }
              }}
              error={fieldState.error?.message ?? serverFields.animalId}
            />
          )}
        />
      ) : null}

      {isInquiry ? (
        <Controller
          control={control}
          name="category"
          render={({ field: { value, onChange }, fieldState }) => (
            <Select<InquiryCategory>
              label={t('form.categoryLabel')}
              placeholder={t('form.categoryPlaceholder')}
              value={value ?? null}
              options={INQUIRY_CATEGORIES.map((c) => ({ value: c, label: t(`category.${c}`) }))}
              onChange={onChange}
              error={fieldState.error?.message ?? serverFields.category}
              required
            />
          )}
        />
      ) : null}

      {supportsAttachments ? (
        <MultiImagePicker
          provider={attachmentProvider}
          onChange={setImageKeys}
          max={MAX_THREAD_IMAGES}
          label={t('form.attachmentsLabel')}
          hint={t('form.attachmentsHint', { count: imageKeys.length, max: MAX_THREAD_IMAGES })}
        />
      ) : null}

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={t('form.submit')}
          fullWidth
          loading={create.isPending}
          disabled={create.isPending || blockedByVetGate}
          onPress={handleSubmit(onSubmit)}
          accessibilityLabel={t('form.submit')}
        />
      </View>
    </OrgFormLayout>
  );
}
