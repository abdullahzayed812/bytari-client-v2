import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { useTheme } from '@/theme';

import { buildMedicalRecordSchema, type MedicalRecordFormValues } from '../validation/schemas';

export interface MedicalRecordFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<MedicalRecordFormValues>;
  submitting: boolean;
  formError?: string | null;
  serverFields?: Record<string, string>;
  onSubmit: (values: MedicalRecordFormValues) => void;
}

const EMPTY: MedicalRecordFormValues = {
  visitDate: '',
  reason: '',
  diagnosis: '',
  treatment: '',
  notes: '',
};

/** Shared add/edit medical-record form. RHF + zod (mirrors the backend), RTL, no API logic. */
export function MedicalRecordForm({
  mode,
  defaultValues,
  submitting,
  formError,
  serverFields = {},
  onSubmit,
}: MedicalRecordFormProps) {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const schema = useMemo(() => buildMedicalRecordSchema(t), [t]);

  const { control, handleSubmit } = useForm<MedicalRecordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...EMPTY, ...defaultValues },
    mode: 'onTouched',
  });

  return (
    <>
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <FormField
        control={control}
        name="visitDate"
        label={t('records.fieldVisitDate')}
        placeholder="YYYY-MM-DD"
        hint={t('records.visitDateHint')}
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
        serverError={serverFields.visitDate}
      />

      <FormField
        control={control}
        name="reason"
        label={t('records.fieldReason')}
        placeholder={t('records.reasonPlaceholder')}
        hint={t('records.atLeastOneHint')}
        multiline
        numberOfLines={2}
        serverError={serverFields.reason}
      />

      <FormField
        control={control}
        name="diagnosis"
        label={t('records.fieldDiagnosis')}
        placeholder={t('records.diagnosisPlaceholder')}
        multiline
        numberOfLines={3}
        serverError={serverFields.diagnosis}
      />

      <FormField
        control={control}
        name="treatment"
        label={t('records.fieldTreatment')}
        placeholder={t('records.treatmentPlaceholder')}
        multiline
        numberOfLines={3}
        serverError={serverFields.treatment}
      />

      <FormField
        control={control}
        name="notes"
        label={t('records.fieldNotes')}
        placeholder={t('records.notesPlaceholder')}
        multiline
        numberOfLines={3}
        serverError={serverFields.notes}
      />

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={mode === 'create' ? t('records.submitCreate') : t('records.submitSave')}
          fullWidth
          loading={submitting}
          disabled={submitting}
          onPress={handleSubmit(onSubmit)}
          accessibilityLabel={
            mode === 'create' ? t('records.submitCreate') : t('records.submitSave')
          }
        />
      </View>
    </>
  );
}
