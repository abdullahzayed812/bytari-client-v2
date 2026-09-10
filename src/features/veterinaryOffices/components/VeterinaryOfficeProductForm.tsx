import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { FormField, Select } from '@/components/forms';
import { useTheme } from '@/theme';

import { VETERINARY_OFFICE_PRODUCT_TYPE_ORDER } from '../constants';
import type { VeterinaryOfficeProductType } from '../types';
import { buildVeterinaryOfficeProductSchema, type VeterinaryOfficeProductFormValues } from '../validation/schemas';

export interface VeterinaryOfficeProductFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<VeterinaryOfficeProductFormValues>;
  submitting: boolean;
  formError?: string | null;
  serverFields?: Record<string, string>;
  onSubmit: (values: VeterinaryOfficeProductFormValues) => void;
}

const EMPTY: VeterinaryOfficeProductFormValues = {
  name: '',
  productType: 'MEDICINE',
  price: '',
  stockQuantity: '',
  description: '',
};

/**
 * Shared add/edit product form for a Veterinary Office. RHF + zod (mirrors
 * the backend), RTL, no API logic. `stockQuantity` is opening stock — shown
 * on create only; afterwards it changes solely through the stock-adjust
 * action on the detail screen.
 */
export function VeterinaryOfficeProductForm({
  mode,
  defaultValues,
  submitting,
  formError,
  serverFields = {},
  onSubmit,
}: VeterinaryOfficeProductFormProps) {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOffices');
  const schema = useMemo(() => buildVeterinaryOfficeProductSchema(t), [t]);

  const { control, handleSubmit } = useForm<VeterinaryOfficeProductFormValues>({
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
        label={t('manage.form.fieldName')}
        placeholder={t('manage.form.namePlaceholder')}
        serverError={serverFields.name}
      />

      <Controller
        control={control}
        name="productType"
        render={({ field: { value, onChange }, fieldState }) => (
          <Select<VeterinaryOfficeProductType>
            label={t('manage.form.fieldType')}
            placeholder={t('manage.form.typePlaceholder')}
            value={(value as VeterinaryOfficeProductType) ?? null}
            options={VETERINARY_OFFICE_PRODUCT_TYPE_ORDER.map((p) => ({
              value: p,
              label: t(`productType.${p}`),
            }))}
            onChange={onChange}
            error={fieldState.error?.message ?? serverFields.productType}
          />
        )}
      />

      <FormField
        control={control}
        name="price"
        label={t('manage.form.fieldPrice')}
        placeholder={t('manage.form.pricePlaceholder')}
        hint={t('manage.form.priceHint')}
        keyboardType="decimal-pad"
        autoCorrect={false}
        serverError={serverFields.price}
      />

      {mode === 'create' ? (
        <FormField
          control={control}
          name="stockQuantity"
          label={t('manage.form.fieldOpeningStock')}
          placeholder="0"
          hint={t('manage.form.openingStockHint')}
          keyboardType="number-pad"
          serverError={serverFields.stockQuantity}
        />
      ) : null}

      <FormField
        control={control}
        name="description"
        label={t('manage.form.fieldDescription')}
        placeholder={t('manage.form.descriptionPlaceholder')}
        multiline
        numberOfLines={4}
        serverError={serverFields.description}
      />

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={mode === 'create' ? t('manage.form.submitCreate') : t('manage.form.submitSave')}
          fullWidth
          loading={submitting}
          disabled={submitting}
          onPress={handleSubmit(onSubmit)}
          accessibilityLabel={mode === 'create' ? t('manage.form.submitCreate') : t('manage.form.submitSave')}
        />
      </View>
    </>
  );
}
