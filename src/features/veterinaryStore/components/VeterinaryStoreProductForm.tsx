import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { FormField, Select } from '@/components/forms';
import { useTheme } from '@/theme';

import { VETERINARY_STORE_PRODUCT_TYPE_ORDER } from '../constants';
import type { VeterinaryStoreProductType } from '../types';
import { buildVeterinaryStoreProductSchema, type VeterinaryStoreProductFormValues } from '../validation/schemas';

export interface VeterinaryStoreProductFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<VeterinaryStoreProductFormValues>;
  submitting: boolean;
  formError?: string | null;
  serverFields?: Record<string, string>;
  onSubmit: (values: VeterinaryStoreProductFormValues) => void;
}

const EMPTY: VeterinaryStoreProductFormValues = {
  name: '',
  productType: 'MEDICINE',
  price: '',
  stockQuantity: '',
  description: '',
};

/**
 * Shared add/edit product form. RHF + zod (mirrors the backend), RTL, no API
 * logic. `stockQuantity` is opening stock — shown on create only; afterwards it
 * changes solely through the stock-adjust action on the detail screen.
 */
export function VeterinaryStoreProductForm({
  mode,
  defaultValues,
  submitting,
  formError,
  serverFields = {},
  onSubmit,
}: VeterinaryStoreProductFormProps) {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryStore');
  const schema = useMemo(() => buildVeterinaryStoreProductSchema(t), [t]);

  const { control, handleSubmit } = useForm<VeterinaryStoreProductFormValues>({
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
        label={t('form.fieldName')}
        placeholder={t('form.namePlaceholder')}
        serverError={serverFields.name}
      />

      <Controller
        control={control}
        name="productType"
        render={({ field: { value, onChange }, fieldState }) => (
          <Select<VeterinaryStoreProductType>
            label={t('form.fieldType')}
            placeholder={t('form.typePlaceholder')}
            value={(value as VeterinaryStoreProductType) ?? null}
            options={VETERINARY_STORE_PRODUCT_TYPE_ORDER.map((p) => ({ value: p, label: t(`productType.${p}`) }))}
            onChange={onChange}
            error={fieldState.error?.message ?? serverFields.productType}
          />
        )}
      />

      <FormField
        control={control}
        name="price"
        label={t('form.fieldPrice')}
        placeholder={t('form.pricePlaceholder')}
        hint={t('form.priceHint')}
        keyboardType="decimal-pad"
        autoCorrect={false}
        serverError={serverFields.price}
      />

      {mode === 'create' ? (
        <FormField
          control={control}
          name="stockQuantity"
          label={t('form.fieldOpeningStock')}
          placeholder="0"
          hint={t('form.openingStockHint')}
          keyboardType="number-pad"
          serverError={serverFields.stockQuantity}
        />
      ) : null}

      <FormField
        control={control}
        name="description"
        label={t('form.fieldDescription')}
        placeholder={t('form.descriptionPlaceholder')}
        multiline
        numberOfLines={4}
        serverError={serverFields.description}
      />

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={mode === 'create' ? t('form.submitCreate') : t('form.submitSave')}
          fullWidth
          loading={submitting}
          disabled={submitting}
          onPress={handleSubmit(onSubmit)}
          accessibilityLabel={mode === 'create' ? t('form.submitCreate') : t('form.submitSave')}
        />
      </View>
    </>
  );
}
