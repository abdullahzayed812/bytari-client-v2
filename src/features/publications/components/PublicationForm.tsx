import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { devDataEnabled } from '@/lib/env';
import { useTheme } from '@/theme';

import { devPublicationListingDefaults } from '../data/devDefaults';
import type { CreatePublicationInput, PublicationKind } from '../types';
import { buildListingSchema, listingValuesToInput } from '../validation/schemas';

import { PublicationListingFieldsForm } from './PublicationListingFieldsForm';

export interface PublicationFormProps {
  kind: PublicationKind;
  submitting: boolean;
  formError?: string | null;
  serverFields?: Record<string, string>;
  onSubmit: (input: CreatePublicationInput) => void;
}

const EMPTY_DEFAULTS = {
  note: '',
  extraNotes: '',
  contactName: '',
  contactPhone: '',
  city: '',
  lostDate: '',
  lostTime: '',
  lostGovernorate: '',
  lostDistrict: '',
  lostLocationDetail: '',
  healthNotes: '',
};

// DEV-ONLY: pre-filled so the form doesn't need retyping on every test run.
const DEFAULT_VALUES = devDataEnabled
  ? { ...EMPTY_DEFAULTS, ...devPublicationListingDefaults() }
  : EMPTY_DEFAULTS;

/**
 * The listing-fields-only form — used by `PublishAnimalScreen` (an already
 * registered pet, so only the per-kind listing fields are collected; the
 * animal profile is skipped). `CreatePublicationScreen` uses
 * `PublicationListingFieldsForm` directly alongside `AnimalProfileFields`.
 */
export function PublicationForm({
  kind,
  submitting,
  formError,
  serverFields = {},
  onSubmit,
}: PublicationFormProps) {
  const theme = useTheme();
  const { t } = useTranslation('publications');
  const schema = useMemo(() => buildListingSchema(t, kind), [t, kind]);

  const { control, handleSubmit } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onTouched',
  });

  const submit = handleSubmit((values) => onSubmit(listingValuesToInput(kind, values)));

  return (
    <>
      <Alert tone="info" message={t('form.approvalNotice')} />

      {formError ? <Alert tone="danger" message={formError} /> : null}

      <PublicationListingFieldsForm kind={kind} control={control} serverFields={serverFields} />

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={t(`form.submit.${kind}`)}
          fullWidth
          loading={submitting}
          disabled={submitting}
          onPress={submit}
          accessibilityLabel={t(`form.submit.${kind}`)}
        />
      </View>
    </>
  );
}
