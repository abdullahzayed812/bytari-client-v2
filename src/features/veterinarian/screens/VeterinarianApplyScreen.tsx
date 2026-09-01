import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert, EmptyState, useToast } from '@/components/feedback';
import { FormField, SegmentedControl } from '@/components/forms';
import { ScrollScreen, Section } from '@/components/layout';
import { ImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { useVeterinarianStatus } from '@/features/auth';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { useApplyForVeterinarian, useVeterinarianDocumentPresignProvider } from '../hooks';
import type { ApplyDocumentInput, VeterinarianDocumentKind } from '../types';
import { buildApplySchema, type ApplyFormValues } from '../validation/schemas';

function buildDocuments(values: ApplyFormValues): ApplyDocumentInput[] {
  const docs: ApplyDocumentInput[] = [];
  if (values.subType === 'VETERINARIAN') {
    if (values.licenseOrId) docs.push({ kind: 'LICENSE_OR_ID', ...values.licenseOrId });
    if (values.additionalId) docs.push({ kind: 'ADDITIONAL_ID', ...values.additionalId });
  } else {
    if (values.studentIdFront) docs.push({ kind: 'STUDENT_ID_FRONT', ...values.studentIdFront });
    if (values.studentIdBack) docs.push({ kind: 'STUDENT_ID_BACK', ...values.studentIdBack });
  }
  return docs;
}

interface DocumentFieldProps {
  kind: VeterinarianDocumentKind;
  label: string;
  required?: boolean;
  value: { storageKey: string; filename: string; mimeType: string } | null | undefined;
  onChange: (value: { storageKey: string; filename: string; mimeType: string } | null) => void;
  error?: string;
}

/** One document-photo slot. Self-contained (no dependency on the `registration` feature). */
function DocumentField({ kind, label, required, onChange, error }: DocumentFieldProps) {
  const { t } = useTranslation('veterinarian');
  const theme = useTheme();
  const { provider, toDocumentRef } = useVeterinarianDocumentPresignProvider(kind);

  return (
    <View style={{ rowGap: theme.spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
        <Label>{label}</Label>
        <Caption color={required ? 'danger' : 'textMuted'}>
          {required ? t('apply.requiredBadge') : t('apply.optionalBadge')}
        </Caption>
      </View>
      <ImageUploader
        value={null}
        provider={provider}
        shape="square"
        size={120}
        onChange={(result) => onChange(result ? toDocumentRef(result) : null)}
      />
      <Caption>{t('apply.maxSizeHint')}</Caption>
      {error ? <Caption color="danger">{error}</Caption> : null}
    </View>
  );
}

/**
 * Route `/veterinarian/apply` — submit or re-submit a veterinarian application.
 * The backend decides eligibility (accepts only `NOT_APPLIED` / `REJECTED`);
 * this screen collects the applicant `subType`, its required documents, and
 * the optional note, and surfaces backend errors.
 */
export default function VeterinarianApplyScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinarian');
  const toast = useToast();
  const vet = useVeterinarianStatus();
  const apply = useApplyForVeterinarian();

  const schema = useMemo(() => buildApplySchema(t), [t]);
  const { control, handleSubmit, watch, resetField } = useForm<ApplyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      note: '',
      subType: 'VETERINARIAN',
      licenseOrId: undefined,
      additionalId: undefined,
      studentIdFront: undefined,
      studentIdBack: undefined,
    },
    mode: 'onTouched',
  });
  const subType = watch('subType');
  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  const alreadyActive = vet.isPending || vet.isApproved;

  const onSubmit = (values: ApplyFormValues) => {
    if (inFlight.current || apply.isPending) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    apply.mutate(
      {
        note: values.note?.trim() ? values.note.trim() : undefined,
        subType: values.subType,
        documents: buildDocuments(values),
      },
      {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('apply.success') });
          router.back();
        },
        onError: (error) => {
          setServerFields(fieldErrors(error));
          setFormError(apiErrorMessage(error));
        },
        onSettled: () => {
          inFlight.current = false;
        },
      },
    );
  };

  return (
    <ScrollScreen>
      <AppHeader title={t('apply.title')} showBack />

      {alreadyActive ? (
        <EmptyState
          icon="checkmark-circle-outline"
          title={vet.isApproved ? t('status.APPROVED') : t('status.PENDING')}
          message={vet.isApproved ? t('apply.alreadyApproved') : t('apply.alreadyPending')}
          actionLabel={t('apply.back')}
          onAction={() => router.back()}
        />
      ) : (
        <Section spacing="xl">
          <Caption>{t('apply.intro')}</Caption>

          {formError ? (
            <View style={{ marginTop: theme.spacing.md }}>
              <Alert tone="danger" message={formError} />
            </View>
          ) : null}

          <View style={{ marginTop: theme.spacing.lg, rowGap: theme.spacing.lg }}>
            <Controller
              control={control}
              name="subType"
              render={({ field: { value, onChange } }) => (
                <SegmentedControl
                  value={value}
                  onChange={(next) => {
                    onChange(next);
                    resetField('licenseOrId');
                    resetField('additionalId');
                    resetField('studentIdFront');
                    resetField('studentIdBack');
                  }}
                  options={[
                    { value: 'VETERINARIAN', label: t('apply.subTypeVet') },
                    { value: 'STUDENT', label: t('apply.subTypeStudent') },
                  ]}
                />
              )}
            />

            <Text variant="bodyStrong">{t('apply.documentsSection')}</Text>

            {subType === 'VETERINARIAN' ? (
              <>
                <Controller
                  control={control}
                  name="licenseOrId"
                  render={({ field: { value, onChange }, fieldState }) => (
                    <DocumentField
                      kind="LICENSE_OR_ID"
                      label={t('apply.licenseOrIdLabel')}
                      required
                      value={value}
                      onChange={onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="additionalId"
                  render={({ field: { value, onChange }, fieldState }) => (
                    <DocumentField
                      kind="ADDITIONAL_ID"
                      label={t('apply.additionalIdLabel')}
                      value={value}
                      onChange={onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </>
            ) : (
              <>
                <Controller
                  control={control}
                  name="studentIdFront"
                  render={({ field: { value, onChange }, fieldState }) => (
                    <DocumentField
                      kind="STUDENT_ID_FRONT"
                      label={t('apply.studentIdFrontLabel')}
                      required
                      value={value}
                      onChange={onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="studentIdBack"
                  render={({ field: { value, onChange }, fieldState }) => (
                    <DocumentField
                      kind="STUDENT_ID_BACK"
                      label={t('apply.studentIdBackLabel')}
                      required
                      value={value}
                      onChange={onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </>
            )}

            <FormField
              control={control}
              name="note"
              label={t('apply.noteLabel')}
              placeholder={t('apply.notePlaceholder')}
              hint={t('apply.noteHint')}
              multiline
              numberOfLines={5}
              serverError={serverFields.note}
            />

            <Button
              label={vet.isRejected ? t('apply.reapplyCta') : t('apply.cta')}
              fullWidth
              loading={apply.isPending}
              disabled={apply.isPending}
              onPress={handleSubmit(onSubmit)}
              accessibilityLabel={vet.isRejected ? t('apply.reapplyCta') : t('apply.cta')}
            />
          </View>
        </Section>
      )}
    </ScrollScreen>
  );
}
