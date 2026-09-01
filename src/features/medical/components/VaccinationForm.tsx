import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { useTheme } from '@/theme';

import { buildVaccinationSchema, type VaccinationFormValues } from '../validation/schemas';

export interface VaccinationFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<VaccinationFormValues>;
  submitting: boolean;
  formError?: string | null;
  serverFields?: Record<string, string>;
  onSubmit: (values: VaccinationFormValues) => void;
}

const EMPTY: VaccinationFormValues = {
  vaccineName: '',
  administeredOn: '',
  nextDueOn: '',
  notes: '',
};

/** Shared add/edit vaccination form. RHF + zod (mirrors the backend), RTL, no API logic. */
export function VaccinationForm({
  mode,
  defaultValues,
  submitting,
  formError,
  serverFields = {},
  onSubmit,
}: VaccinationFormProps) {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const schema = useMemo(() => buildVaccinationSchema(t), [t]);

  const { control, handleSubmit } = useForm<VaccinationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...EMPTY, ...defaultValues },
    mode: 'onTouched',
  });

  return (
    <>
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <FormField
        control={control}
        name="vaccineName"
        label={t('vaccinations.fieldVaccineName')}
        placeholder={t('vaccinations.vaccineNamePlaceholder')}
        serverError={serverFields.vaccineName}
      />

      <FormField
        control={control}
        name="administeredOn"
        label={t('vaccinations.fieldAdministeredOn')}
        placeholder="YYYY-MM-DD"
        hint={t('vaccinations.administeredOnHint')}
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
        serverError={serverFields.administeredOn}
      />

      <FormField
        control={control}
        name="nextDueOn"
        label={t('vaccinations.fieldNextDueOn')}
        placeholder="YYYY-MM-DD"
        hint={t('vaccinations.nextDueOnHint')}
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
        serverError={serverFields.nextDueOn}
      />

      <FormField
        control={control}
        name="notes"
        label={t('vaccinations.fieldNotes')}
        placeholder={t('vaccinations.notesPlaceholder')}
        multiline
        numberOfLines={3}
        serverError={serverFields.notes}
      />

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={mode === 'create' ? t('vaccinations.submitCreate') : t('vaccinations.submitSave')}
          fullWidth
          loading={submitting}
          disabled={submitting}
          onPress={handleSubmit(onSubmit)}
          accessibilityLabel={
            mode === 'create' ? t('vaccinations.submitCreate') : t('vaccinations.submitSave')
          }
        />
      </View>
    </>
  );
}
