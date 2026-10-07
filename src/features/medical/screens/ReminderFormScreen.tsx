import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Chip } from '@/components/content';
import { Alert, ErrorState, Loading, useToast } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { Row } from '@/components/layout';
import { Label } from '@/components/typography';
import { OrgFormLayout } from '@/features/organizations';
import { fieldErrors } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { addDaysIso, todayIso } from '../constants';
import { useReminder, useSaveReminder } from '../hooks';
import { REMINDER_TYPES, type ReminderInput } from '../types';
import {
  buildReminderSchema,
  medicalErrorMessage,
  type ReminderFormValues,
} from '../validation/schemas';

import { useMedicalRouteScope } from './useMedicalRouteScope';

/**
 * Add / edit a reminder — CLINIC context only (legacy "إضافة تذكير" /
 * "تعديل التذكير": title*, description, date*, type). New reminders default to
 * a week from today, as in the legacy form.
 */
export default function ReminderFormScreen() {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const toast = useToast();
  const { animalId, organizationId, reminderId } = useMedicalRouteScope();
  const orgId = organizationId ?? '';
  const isEdit = Boolean(reminderId);
  const existing = useReminder(organizationId, animalId, reminderId);
  const save = useSaveReminder(orgId, animalId);
  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  if (isEdit && existing.isLoading) {
    return (
      <OrgFormLayout title={t('reminders.editTitle')}>
        <Loading fill />
      </OrgFormLayout>
    );
  }
  if (isEdit && (existing.isError || !existing.data)) {
    return (
      <OrgFormLayout title={t('reminders.editTitle')}>
        <ErrorState error={existing.error} onRetry={() => void existing.refetch()} />
      </OrgFormLayout>
    );
  }

  const r = existing.data;
  const defaults: ReminderFormValues = r
    ? {
        title: r.title,
        description: r.description ?? '',
        reminderDate: r.reminderDate,
        reminderType: r.reminderType,
      }
    : {
        title: '',
        description: '',
        reminderDate: addDaysIso(todayIso(), 7),
        reminderType: 'CHECKUP',
      };

  const onSubmit = (values: ReminderFormValues) => {
    if (inFlight.current || save.isPending) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    const body: ReminderInput = {
      title: values.title.trim(),
      description: values.description?.trim()
        ? values.description.trim()
        : isEdit
          ? null
          : undefined,
      reminderDate: values.reminderDate.trim(),
      reminderType: values.reminderType,
    };
    save.mutate(
      { reminderId, body },
      {
        onSuccess: () => {
          toast.show({
            tone: 'success',
            message: isEdit ? t('reminders.editSuccess') : t('reminders.createSuccess'),
          });
          router.back();
        },
        onError: (error) => {
          setServerFields(fieldErrors(error));
          setFormError(medicalErrorMessage(error, t));
        },
        onSettled: () => {
          inFlight.current = false;
        },
      },
    );
  };

  return (
    <OrgFormLayout title={isEdit ? t('reminders.editTitle') : t('reminders.addTitle')}>
      <ReminderForm
        defaults={defaults}
        submitting={save.isPending}
        formError={formError}
        serverFields={serverFields}
        submitLabel={isEdit ? t('reminders.submitSave') : t('reminders.submitCreate')}
        onSubmit={onSubmit}
        gap={theme.spacing.sm}
      />
    </OrgFormLayout>
  );
}

function ReminderForm({
  defaults,
  submitting,
  formError,
  serverFields,
  submitLabel,
  onSubmit,
  gap,
}: {
  defaults: ReminderFormValues;
  submitting: boolean;
  formError: string | null;
  serverFields: Record<string, string>;
  submitLabel: string;
  onSubmit: (values: ReminderFormValues) => void;
  gap: number;
}) {
  const { t } = useTranslation('medical');
  const schema = useMemo(() => buildReminderSchema(t), [t]);
  const { control, handleSubmit, watch, setValue } = useForm<ReminderFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
    mode: 'onTouched',
  });
  const type = watch('reminderType');

  return (
    <>
      {formError ? <Alert tone="danger" message={formError} /> : null}
      <FormField
        control={control}
        name="title"
        label={t('reminders.fieldTitle')}
        placeholder={t('reminders.titlePlaceholder')}
        serverError={serverFields.title}
      />
      <FormField
        control={control}
        name="description"
        label={t('reminders.fieldDescription')}
        placeholder={t('reminders.descriptionPlaceholder')}
        multiline
        numberOfLines={3}
        serverError={serverFields.description}
      />
      <FormField
        control={control}
        name="reminderDate"
        label={t('reminders.fieldDate')}
        placeholder="YYYY-MM-DD"
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
        serverError={serverFields.reminderDate}
      />
      <View style={{ rowGap: gap, marginBottom: gap }}>
        <Label>{t('reminders.fieldType')}</Label>
        <Row gap="sm" wrap>
          {REMINDER_TYPES.map((rt) => (
            <Chip
              key={rt}
              label={t(`reminders.type.${rt}`)}
              selected={type === rt}
              onPress={() => setValue('reminderType', rt)}
            />
          ))}
        </Row>
      </View>
      <Button
        label={submitLabel}
        fullWidth
        loading={submitting}
        disabled={submitting}
        onPress={handleSubmit(onSubmit)}
      />
    </>
  );
}
