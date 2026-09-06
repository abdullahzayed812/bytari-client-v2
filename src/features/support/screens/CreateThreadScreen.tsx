import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert, useToast } from '@/components/feedback';
import { FormField, Select } from '@/components/forms';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { OrgFormLayout } from '@/features/organizations';
import { usePets } from '@/features/pets';
import { useCapabilities } from '@/hooks';
import { fieldErrors } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';
import { useTheme } from '@/theme';

import { SUPPORT_KIND_META, kindFromSlug } from '../constants';
import { useCreateThread } from '../hooks';
import {
  buildConsultationSchema,
  buildInquirySchema,
  supportErrorMessage,
  type ConsultationFormValues,
} from '../validation/schemas';

/**
 * Route `/support/[kind]/create`. Consultation: message + OPTIONAL owned-animal
 * (backend rejects an animal you don't own). Inquiry: message only, APPROVED
 * vets only (backend authoritative; the client only shows a hint).
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

  const schema = useMemo(
    () => (isConsultation ? buildConsultationSchema(t) : buildInquirySchema(t)),
    [isConsultation, t],
  );
  const { control, handleSubmit } = useForm<ConsultationFormValues>({
    resolver: zodResolver(schema),
    // DEV-ONLY: pre-filled so the form doesn't need retyping on every test run.
    defaultValues: {
      body: devDataEnabled ? 'استشارة تجريبية لأغراض الاختبار خلال مرحلة التطوير' : '',
      animalId: '',
    },
    mode: 'onTouched',
  });

  const create = useCreateThread(kind);
  const pets = usePets({ pageSize: 50, enabled: isConsultation });
  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  const blockedByVetGate =
    meta.createRequiresApprovedVet && !caps.isApprovedVeterinarian && !caps.isAdmin;

  const onSubmit = (values: ConsultationFormValues) => {
    if (inFlight.current || create.isPending) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    const payload = isConsultation
      ? { body: values.body.trim(), animalId: values.animalId?.trim() || undefined }
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
              onChange={onChange}
              error={fieldState.error?.message ?? serverFields.animalId}
            />
          )}
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
