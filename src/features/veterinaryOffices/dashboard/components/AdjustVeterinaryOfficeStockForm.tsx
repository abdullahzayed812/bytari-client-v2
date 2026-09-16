import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { Caption } from '@/components/typography';
import { devDataEnabled } from '@/lib/env';
import { useTheme } from '@/theme';

import { devAdjustStockDefaults } from '../../data/devDefaults';
import { buildAdjustVeterinaryOfficeStockSchema, type AdjustVeterinaryOfficeStockFormValues } from '../../validation/schemas';

export interface AdjustVeterinaryOfficeStockFormProps {
  currentStock: number;
  submitting: boolean;
  formError?: string | null;
  serverFields?: Record<string, string>;
  onSubmit: (values: AdjustVeterinaryOfficeStockFormValues) => void;
}

/**
 * Signed stock-delta form (`POST .../office-products/:id/stock`). A negative
 * delta that would take stock below zero is rejected by the backend
 * (`INSUFFICIENT_STOCK`); this form only checks the delta is a non-zero
 * integer.
 */
export function AdjustVeterinaryOfficeStockForm({
  currentStock,
  submitting,
  formError,
  serverFields = {},
  onSubmit,
}: AdjustVeterinaryOfficeStockFormProps) {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOffices');
  const schema = useMemo(() => buildAdjustVeterinaryOfficeStockSchema(t), [t]);

  const { control, handleSubmit } = useForm<AdjustVeterinaryOfficeStockFormValues>({
    resolver: zodResolver(schema),
    // DEV-ONLY: pre-filled so the form doesn't need retyping on every test run.
    defaultValues: devDataEnabled ? devAdjustStockDefaults() : { delta: '', reason: '' },
    mode: 'onTouched',
  });

  return (
    <>
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <Caption>{t('manage.stock.currentLabel', { count: currentStock })}</Caption>

      <FormField
        control={control}
        name="delta"
        label={t('manage.stock.fieldDelta')}
        placeholder={t('manage.stock.deltaPlaceholder')}
        hint={t('manage.stock.deltaHint')}
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
        serverError={serverFields.delta}
      />

      <FormField
        control={control}
        name="reason"
        label={t('manage.stock.fieldReason')}
        placeholder={t('manage.stock.reasonPlaceholder')}
        multiline
        numberOfLines={2}
        serverError={serverFields.reason}
      />

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={t('manage.stock.submit')}
          fullWidth
          loading={submitting}
          disabled={submitting}
          onPress={handleSubmit(onSubmit)}
          accessibilityLabel={t('manage.stock.submit')}
        />
      </View>
    </>
  );
}
