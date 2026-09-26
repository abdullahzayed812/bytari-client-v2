import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { useTheme } from '@/theme';

import { buildCattleBatchSchema, type CattleBatchFormValues } from '../validation/schemas';

export interface CattleBatchFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<CattleBatchFormValues>;
  submitting: boolean;
  formError?: string | null;
  serverFields?: Record<string, string>;
  /** The sale price is financial data — only the farm owner / admin sees and sets it. */
  showPrice?: boolean;
  onSubmit: (values: CattleBatchFormValues) => void;
}

/** Today, `YYYY-MM-DD` in the device's local timezone (matches the schema's not-future rule). */
function today(): string {
  const d = new Date();
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Starter values so a new batch is one edit away from ready. Overridden by `defaultValues` in edit mode. */
const DEFAULTS: CattleBatchFormValues = {
  name: 'دفعة أبقار 1',
  breed: 'الهولشتاين',
  headCount: '30',
  calfCount: '8',
  bullCount: '2',
  cowCount: '20',
  arrivalDate: today(),
  targetPricePerKg: '',
  notes: '',
};

/** Add/edit cattle-batch form. Mirrors `SheepBatchForm` exactly. */
export function CattleBatchForm({
  mode,
  defaultValues,
  submitting,
  formError,
  serverFields = {},
  showPrice = true,
  onSubmit,
}: CattleBatchFormProps) {
  const theme = useTheme();
  const { t } = useTranslation('sheepCattleFarm');
  const schema = useMemo(
    () => buildCattleBatchSchema(t, { requirePrice: showPrice }),
    [t, showPrice],
  );

  const { control, handleSubmit } = useForm<CattleBatchFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...DEFAULTS, ...defaultValues },
    mode: 'onTouched',
  });

  return (
    <>
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <FormField
        control={control}
        name="name"
        label={t('batchForm.fieldName')}
        serverError={serverFields.name}
      />
      <FormField
        control={control}
        name="breed"
        label={t('batchForm.fieldBreed')}
        serverError={serverFields.breed}
      />
      <FormField
        control={control}
        name="headCount"
        label={t('batchForm.fieldHeadCount')}
        placeholder="0"
        keyboardType="number-pad"
        serverError={serverFields.headCount}
      />
      {showPrice ? (
        <FormField
          control={control}
          name="targetPricePerKg"
          label={t('batchForm.fieldTargetPrice')}
          hint={t('batchForm.targetPriceHint')}
          placeholder="0"
          keyboardType="decimal-pad"
          required
          serverError={serverFields.targetPricePerKg}
        />
      ) : null}

      <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <FormField
            control={control}
            name="calfCount"
            label={t('batchForm.fieldCalfCount')}
            placeholder="0"
            keyboardType="number-pad"
            serverError={serverFields.calfCount}
          />
        </View>
        <View style={{ flex: 1 }}>
          <FormField
            control={control}
            name="bullCount"
            label={t('batchForm.fieldBullCount')}
            placeholder="0"
            keyboardType="number-pad"
            serverError={serverFields.bullCount}
          />
        </View>
        <View style={{ flex: 1 }}>
          <FormField
            control={control}
            name="cowCount"
            label={t('batchForm.fieldCowCount')}
            placeholder="0"
            keyboardType="number-pad"
            serverError={serverFields.cowCount}
          />
        </View>
      </View>

      <FormField
        control={control}
        name="arrivalDate"
        label={t('batchForm.fieldArrivalDate')}
        placeholder="YYYY-MM-DD"
        hint={t('batchForm.arrivalDateHint')}
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
        serverError={serverFields.arrivalDate}
      />
      <FormField
        control={control}
        name="notes"
        label={t('batchForm.fieldNotes')}
        multiline
        numberOfLines={3}
        serverError={serverFields.notes}
      />

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={mode === 'create' ? t('batchForm.submitCreate') : t('batchForm.submitSave')}
          fullWidth
          loading={submitting}
          disabled={submitting}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </>
  );
}
