import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { FormField, Select } from '@/components/forms';
import { useTheme } from '@/theme';

import type { VetStoreCategory, VetStoreProductStatus } from '../../types';

export interface VeterinarianStoreProductFormValues {
  name: string;
  categoryId: string | null;
  price: string;
  stockQuantity: string;
  description: string;
  status: VetStoreProductStatus;
}

interface VeterinarianStoreProductFormProps {
  mode: 'create' | 'edit';
  categories: VetStoreCategory[];
  defaultValues?: Partial<VeterinarianStoreProductFormValues>;
  submitting: boolean;
  formError?: string | null;
  onSubmit: (values: VeterinarianStoreProductFormValues) => void;
}

const EMPTY: VeterinarianStoreProductFormValues = {
  name: '',
  categoryId: null,
  price: '',
  stockQuantity: '',
  description: '',
  status: 'ACTIVE',
};

/** Shared add/edit product form for Veterinarian Store admin. RHF + zod, RTL. */
export function VeterinarianStoreProductForm({
  mode,
  categories,
  defaultValues,
  submitting,
  formError,
  onSubmit,
}: VeterinarianStoreProductFormProps) {
  const theme = useTheme();
  const { t } = useTranslation('veterinarianStore');

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t('admin.form.errors.name')).max(200),
        categoryId: z.string().uuid().nullable(),
        price: z
          .string()
          .trim()
          .regex(/^\d{1,8}(\.\d{1,2})?$/, t('admin.form.errors.price')),
        stockQuantity: z
          .string()
          .trim()
          .regex(/^\d{0,9}$/, t('admin.form.errors.stock')),
        description: z.string().trim().max(4000),
        status: z.enum(['ACTIVE', 'INACTIVE']),
      }),
    [t],
  );

  const { control, handleSubmit } = useForm<VeterinarianStoreProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...EMPTY, ...defaultValues },
    mode: 'onTouched',
  });

  const categoryOptions = [
    { value: '', label: t('admin.form.fieldCategoryPlaceholder') },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <View style={{ rowGap: theme.spacing.md }}>
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <FormField control={control} name="name" label={t('admin.form.fieldName')} />

      <Controller
        control={control}
        name="categoryId"
        render={({ field: { value, onChange }, fieldState }) => (
          <Select<string>
            label={t('admin.form.fieldCategory')}
            placeholder={t('admin.form.fieldCategoryPlaceholder')}
            value={value ?? ''}
            options={categoryOptions}
            onChange={(v) => onChange(v === '' ? null : v)}
            error={fieldState.error?.message}
          />
        )}
      />

      <FormField
        control={control}
        name="price"
        label={t('admin.form.fieldPrice')}
        keyboardType="decimal-pad"
        autoCorrect={false}
      />

      <FormField
        control={control}
        name="stockQuantity"
        label={t('admin.form.fieldStock')}
        keyboardType="number-pad"
        placeholder="0"
      />

      <FormField
        control={control}
        name="description"
        label={t('admin.form.fieldDescription')}
        multiline
        numberOfLines={4}
      />

      <Controller
        control={control}
        name="status"
        render={({ field: { value, onChange } }) => (
          <Select<VetStoreProductStatus>
            label={t('admin.form.fieldStatus')}
            value={value}
            options={[
              { value: 'ACTIVE', label: t('admin.form.statusActive') },
              { value: 'INACTIVE', label: t('admin.form.statusInactive') },
            ]}
            onChange={onChange}
          />
        )}
      />

      <Button
        label={mode === 'create' ? t('admin.form.submitCreate') : t('admin.form.submitSave')}
        fullWidth
        loading={submitting}
        disabled={submitting}
        onPress={handleSubmit(onSubmit)}
      />
    </View>
  );
}
