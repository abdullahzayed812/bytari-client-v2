import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { FormField, Select } from '@/components/forms';
import { useTheme } from '@/theme';

import { BIRD_TYPE_ORDER } from '../constants';
import type { PoultryBirdType } from '../types';
import { buildPoultryFlockSchema, type PoultryFlockFormValues } from '../validation/schemas';

export interface PoultryFlockFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<PoultryFlockFormValues>;
  submitting: boolean;
  formError?: string | null;
  serverFields?: Record<string, string>;
  /** The sale price is financial data — only the farm owner / admin sees and sets it. */
  showPrice?: boolean;
  onSubmit: (values: PoultryFlockFormValues) => void;
}

const EMPTY: PoultryFlockFormValues = {
  name: '',
  birdType: 'CHICKEN',
  birdCount: '',
  arrivalDate: '',
  targetPricePerKg: '',
  notes: '',
};

/** Shared add/edit poultry-flock form. RHF + zod (mirrors the backend), RTL, no API logic. */
export function PoultryFlockForm({
  mode,
  defaultValues,
  submitting,
  formError,
  serverFields = {},
  showPrice = true,
  onSubmit,
}: PoultryFlockFormProps) {
  const theme = useTheme();
  const { t } = useTranslation('farm');
  const schema = useMemo(
    () => buildPoultryFlockSchema(t, { requirePrice: showPrice }),
    [t, showPrice],
  );

  const { control, handleSubmit } = useForm<PoultryFlockFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...EMPTY, ...defaultValues },
    mode: 'onTouched',
  });

  return (
    <>
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <FormField
        control={control}
        name="name"
        label={t('poultry.fieldName')}
        placeholder={t('poultry.namePlaceholder')}
        serverError={serverFields.name}
      />

      <Controller
        control={control}
        name="birdType"
        render={({ field: { value, onChange }, fieldState }) => (
          <Select<PoultryBirdType>
            label={t('poultry.fieldBirdType')}
            placeholder={t('poultry.birdTypePlaceholder')}
            value={(value as PoultryBirdType) ?? null}
            options={BIRD_TYPE_ORDER.map((b) => ({ value: b, label: t(`birdType.${b}`) }))}
            onChange={onChange}
            error={fieldState.error?.message ?? serverFields.birdType}
          />
        )}
      />

      <FormField
        control={control}
        name="birdCount"
        label={t('poultry.fieldBirdCount')}
        placeholder="0"
        keyboardType="number-pad"
        serverError={serverFields.birdCount}
      />

      {showPrice ? (
        <FormField
          control={control}
          name="targetPricePerKg"
          label={t('poultry.fieldTargetPrice')}
          hint={t('poultry.targetPriceHint')}
          placeholder="0"
          keyboardType="decimal-pad"
          required
          serverError={serverFields.targetPricePerKg}
        />
      ) : null}

      <FormField
        control={control}
        name="arrivalDate"
        label={t('poultry.fieldArrivalDate')}
        placeholder="YYYY-MM-DD"
        hint={t('poultry.arrivalDateHint')}
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
        serverError={serverFields.arrivalDate}
      />

      <FormField
        control={control}
        name="notes"
        label={t('poultry.fieldNotes')}
        placeholder={t('poultry.notesPlaceholder')}
        multiline
        numberOfLines={3}
        serverError={serverFields.notes}
      />

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={mode === 'create' ? t('poultry.submitCreate') : t('poultry.submitSave')}
          fullWidth
          loading={submitting}
          disabled={submitting}
          onPress={handleSubmit(onSubmit)}
          accessibilityLabel={
            mode === 'create' ? t('poultry.submitCreate') : t('poultry.submitSave')
          }
        />
      </View>
    </>
  );
}
