import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { useTheme } from '@/theme';

import { buildSheepBatchSchema, type SheepBatchFormValues } from '../validation/schemas';

export interface SheepBatchFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<SheepBatchFormValues>;
  submitting: boolean;
  formError?: string | null;
  serverFields?: Record<string, string>;
  onSubmit: (values: SheepBatchFormValues) => void;
}

const EMPTY: SheepBatchFormValues = {
  name: '',
  breed: '',
  headCount: '',
  lambCount: '',
  maleCount: '',
  femaleCount: '',
  arrivalDate: '',
  notes: '',
};

/** Add/edit sheep-batch form. Mirrors `PoultryFlockForm` exactly (bird-type picker → age/sex headcount breakdown). */
export function SheepBatchForm({ mode, defaultValues, submitting, formError, serverFields = {}, onSubmit }: SheepBatchFormProps) {
  const theme = useTheme();
  const { t } = useTranslation('sheepCattleFarm');
  const schema = useMemo(() => buildSheepBatchSchema(t), [t]);

  const { control, handleSubmit } = useForm<SheepBatchFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...EMPTY, ...defaultValues },
    mode: 'onTouched',
  });

  return (
    <>
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <FormField control={control} name="name" label={t('batchForm.fieldName')} serverError={serverFields.name} />
      <FormField control={control} name="breed" label={t('batchForm.fieldBreed')} serverError={serverFields.breed} />
      <FormField control={control} name="headCount" label={t('batchForm.fieldHeadCount')} placeholder="0" keyboardType="number-pad" serverError={serverFields.headCount} />

      <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <FormField control={control} name="lambCount" label={t('batchForm.fieldLambCount')} placeholder="0" keyboardType="number-pad" serverError={serverFields.lambCount} />
        </View>
        <View style={{ flex: 1 }}>
          <FormField control={control} name="maleCount" label={t('batchForm.fieldMaleCount')} placeholder="0" keyboardType="number-pad" serverError={serverFields.maleCount} />
        </View>
        <View style={{ flex: 1 }}>
          <FormField control={control} name="femaleCount" label={t('batchForm.fieldFemaleCount')} placeholder="0" keyboardType="number-pad" serverError={serverFields.femaleCount} />
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
      <FormField control={control} name="notes" label={t('batchForm.fieldNotes')} multiline numberOfLines={3} serverError={serverFields.notes} />

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
