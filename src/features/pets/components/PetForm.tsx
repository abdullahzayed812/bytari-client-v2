import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { FormField, Select } from '@/components/forms';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { SEX_OPTIONS, SPECIES_OPTIONS } from '../constants';
import type { PetSex, PetSpecies } from '../types';
import { buildPetSchema, type PetFormValues } from '../validation/schemas';

export interface PetFormProps {
  mode: 'add' | 'edit';
  defaultValues?: Partial<PetFormValues>;
  submitting: boolean;
  /** Top-level backend error (mapped to Arabic). */
  formError?: string | null;
  /** Per-field backend (422) errors keyed by field name. */
  serverFields?: Record<string, string>;
  onSubmit: (values: PetFormValues) => void;
}

const EMPTY: PetFormValues = {
  name: '',
  species: 'DOG',
  sex: undefined,
  breed: '',
  dateOfBirth: '',
  notes: '',
};

/** Shared Add/Edit pet form. RHF + zod (mirrors the backend), RTL, no API logic. */
export function PetForm({
  mode,
  defaultValues,
  submitting,
  formError,
  serverFields = {},
  onSubmit,
}: PetFormProps) {
  const theme = useTheme();
  const { t } = useTranslation('pets');
  const schema = useMemo(() => buildPetSchema(t), [t]);

  const { control, handleSubmit } = useForm<PetFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...EMPTY, ...defaultValues },
    mode: 'onTouched',
  });

  const submit = handleSubmit(onSubmit);

  return (
    <>
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <Text variant="caption" color="textMuted">
        {t(mode === 'add' ? 'form.addSubtitle' : 'form.editSubtitle')}
      </Text>

      <FormField
        control={control}
        name="name"
        label={t('form.nameLabel')}
        placeholder={t('form.namePlaceholder')}
        autoCapitalize="words"
        returnKeyType="next"
        serverError={serverFields.name}
      />

      <Controller
        control={control}
        name="species"
        render={({ field: { value, onChange }, fieldState }) => (
          <Select<PetSpecies>
            label={t('form.speciesLabel')}
            placeholder={t('form.speciesPlaceholder')}
            value={(value as PetSpecies) ?? null}
            options={SPECIES_OPTIONS.map((s) => ({ value: s, label: t(`species.${s}`) }))}
            onChange={onChange}
            error={fieldState.error?.message ?? serverFields.species}
          />
        )}
      />

      <Controller
        control={control}
        name="sex"
        render={({ field: { value, onChange }, fieldState }) => (
          <Select<PetSex>
            label={t('form.sexLabel')}
            placeholder={t('form.sexPlaceholder')}
            value={(value as PetSex) ?? null}
            options={SEX_OPTIONS.map((s) => ({ value: s, label: t(`sex.${s}`) }))}
            onChange={onChange}
            error={fieldState.error?.message ?? serverFields.sex}
          />
        )}
      />

      <FormField
        control={control}
        name="breed"
        label={t('form.breedLabel')}
        placeholder={t('form.breedPlaceholder')}
        returnKeyType="next"
        serverError={serverFields.breed}
      />

      <FormField
        control={control}
        name="dateOfBirth"
        label={t('form.dobLabel')}
        placeholder={t('form.dobPlaceholder')}
        hint={t('form.dobHint')}
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
        returnKeyType="next"
        serverError={serverFields.dateOfBirth}
      />

      <FormField
        control={control}
        name="notes"
        label={t('form.notesLabel')}
        placeholder={t('form.notesPlaceholder')}
        multiline
        numberOfLines={4}
        serverError={serverFields.notes}
      />

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={mode === 'add' ? t('form.submitAdd') : t('form.submitEdit')}
          fullWidth
          loading={submitting}
          disabled={submitting}
          onPress={submit}
          accessibilityLabel={mode === 'add' ? t('form.submitAdd') : t('form.submitEdit')}
        />
      </View>
    </>
  );
}
