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

import { devAdjustStockDefaults } from '../data/devDefaults';
import { buildAdjustStockSchema, type AdjustStockFormValues } from '../validation/schemas';

export interface AdjustStockFormProps {
  currentStock: number;
  submitting: boolean;
  formError?: string | null;
  serverFields?: Record<string, string>;
  onSubmit: (values: AdjustStockFormValues) => void;
}

/**
 * Signed stock-delta form (`POST .../products/:id/stock`). A negative delta that
 * would take stock below zero is rejected by the backend (`INSUFFICIENT_STOCK`);
 * this form only checks the delta is a non-zero integer.
 */
export function AdjustStockForm({
  currentStock,
  submitting,
  formError,
  serverFields = {},
  onSubmit,
}: AdjustStockFormProps) {
  const theme = useTheme();
  const { t } = useTranslation('store');
  const schema = useMemo(() => buildAdjustStockSchema(t), [t]);

  const { control, handleSubmit } = useForm<AdjustStockFormValues>({
    resolver: zodResolver(schema),
    // DEV-ONLY: pre-filled so the form doesn't need retyping on every test run.
    defaultValues: devDataEnabled ? devAdjustStockDefaults() : { delta: '', reason: '' },
    mode: 'onTouched',
  });

  return (
    <>
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <Caption>{t('stock.currentLabel', { count: currentStock })}</Caption>

      <FormField
        control={control}
        name="delta"
        label={t('stock.fieldDelta')}
        placeholder={t('stock.deltaPlaceholder')}
        hint={t('stock.deltaHint')}
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
        serverError={serverFields.delta}
      />

      <FormField
        control={control}
        name="reason"
        label={t('stock.fieldReason')}
        placeholder={t('stock.reasonPlaceholder')}
        multiline
        numberOfLines={2}
        serverError={serverFields.reason}
      />

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={t('stock.submit')}
          fullWidth
          loading={submitting}
          disabled={submitting}
          onPress={handleSubmit(onSubmit)}
          accessibilityLabel={t('stock.submit')}
        />
      </View>
    </>
  );
}
