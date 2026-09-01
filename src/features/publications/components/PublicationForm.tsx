import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { Caption } from '@/components/typography';
import { useTheme } from '@/theme';

import type { PublicationKind } from '../types';
import { buildPublicationSchema, type PublicationFormValues } from '../validation/schemas';

export interface PublicationFormProps {
  kind: PublicationKind;
  submitting: boolean;
  formError?: string | null;
  serverFields?: Record<string, string>;
  onSubmit: (values: PublicationFormValues) => void;
}

/**
 * The publish form. The backend model has ONLY an optional `note` — no location,
 * date, image or description fields exist, so there is nothing else to collect.
 * Always shows the "subject to review" notice (§7) — publication is never
 * immediate.
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
  const schema = useMemo(() => buildPublicationSchema(t), [t]);

  const { control, handleSubmit } = useForm<PublicationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { note: '' },
    mode: 'onTouched',
  });

  return (
    <>
      <Alert tone="info" message={t('form.approvalNotice')} />

      {formError ? <Alert tone="danger" message={formError} /> : null}

      <FormField
        control={control}
        name="note"
        label={t(`form.noteLabel.${kind}`)}
        placeholder={t(`form.notePlaceholder.${kind}`)}
        hint={t('form.noteHint')}
        multiline
        numberOfLines={4}
        serverError={serverFields.note}
      />

      <Caption>{t('form.mediaNote')}</Caption>

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={t(`form.submit.${kind}`)}
          fullWidth
          loading={submitting}
          disabled={submitting}
          onPress={handleSubmit(onSubmit)}
          accessibilityLabel={t(`form.submit.${kind}`)}
        />
      </View>
    </>
  );
}
