import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { FormField, Select } from '@/components/forms';
import { useTheme } from '@/theme';

import { PRODUCT_TYPE_ORDER } from '../constants';
import type { ProductType } from '../types';
import { buildProductSchema, type ProductFormValues } from '../validation/schemas';

export interface ProductFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<ProductFormValues>;
  submitting: boolean;
  formError?: string | null;
  serverFields?: Record<string, string>;
  onSubmit: (values: ProductFormValues) => void;
}

const EMPTY: ProductFormValues = {
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
export function ProductForm({
  mode,
  defaultValues,
  submitting,
  formError,
  serverFields = {},
  onSubmit,
}: ProductFormProps) {
  const theme = useTheme();
  const { t } = useTranslation('store');
  const schema = useMemo(() => buildProductSchema(t), [t]);

  const { control, handleSubmit } = useForm<ProductFormValues>({
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
          <Select<ProductType>
            label={t('form.fieldType')}
            placeholder={t('form.typePlaceholder')}
            value={(value as ProductType) ?? null}
            options={PRODUCT_TYPE_ORDER.map((p) => ({ value: p, label: t(`productType.${p}`) }))}
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
