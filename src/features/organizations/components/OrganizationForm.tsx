import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { FormField, Select } from '@/components/forms';
import { Caption } from '@/components/typography';
import { useTheme } from '@/theme';

import { ORG_TYPE_ORDER } from '../constants';
import { VET_APPROVAL_REQUIRED_TYPES, type OrganizationType } from '../types';
import {
  buildCreateOrganizationSchema,
  buildEditOrganizationSchema,
  type CreateOrganizationFormValues,
} from '../validation/schemas';

interface CreateProps {
  mode: 'create';
  /** Gate CLINIC / FARM in the picker for non-approved vets (UX only — backend re-checks). */
  vetApproved: boolean;
  defaultValues?: Partial<CreateOrganizationFormValues>;
  submitting: boolean;
  formError?: string | null;
  serverFields?: Record<string, string>;
  onSubmit: (values: CreateOrganizationFormValues) => void;
}

interface EditProps {
  mode: 'edit';
  defaultValues: { name: string; description: string };
  submitting: boolean;
  formError?: string | null;
  serverFields?: Record<string, string>;
  onSubmit: (values: { name: string; description: string }) => void;
}

export type OrganizationFormProps = CreateProps | EditProps;

/** Shared create / edit organization form. RHF + zod (mirrors the backend), RTL, no API logic. */
export function OrganizationForm(props: OrganizationFormProps) {
  const theme = useTheme();
  const { t } = useTranslation('organizations');

  if (props.mode === 'edit') {
    return <EditForm {...props} t={t} theme={theme} />;
  }
  return <CreateForm {...props} t={t} theme={theme} />;
}

type Ctx = {
  t: ReturnType<typeof useTranslation<'organizations'>>['t'];
  theme: ReturnType<typeof useTheme>;
};

function CreateForm({
  vetApproved,
  defaultValues,
  submitting,
  formError,
  serverFields = {},
  onSubmit,
  t,
  theme,
}: CreateProps & Ctx) {
  const schema = useMemo(() => buildCreateOrganizationSchema(t), [t]);
  const { control, handleSubmit, watch } = useForm<CreateOrganizationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'VETERINARY_OFFICE', name: '', description: '', ...defaultValues },
    mode: 'onTouched',
  });

  const selectedType = watch('type');
  const needsApproval = VET_APPROVAL_REQUIRED_TYPES.includes(selectedType as OrganizationType);

  const options = ORG_TYPE_ORDER.map((type) => ({
    value: type,
    label: t(`type.${type}`),
    description: VET_APPROVAL_REQUIRED_TYPES.includes(type)
      ? t('form.typeNeedsApproval')
      : t('form.typeNoApproval'),
  }));

  return (
    <>
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <Controller
        control={control}
        name="type"
        render={({ field: { value, onChange }, fieldState }) => (
          <Select<OrganizationType>
            label={t('form.typeLabel')}
            placeholder={t('form.typePlaceholder')}
            value={(value as OrganizationType) ?? null}
            options={options}
            onChange={onChange}
            error={fieldState.error?.message ?? serverFields.type}
          />
        )}
      />

      {needsApproval && !vetApproved ? (
        <Alert tone="warning" message={t('form.vetApprovalRequired')} />
      ) : null}

      <FormField
        control={control}
        name="name"
        label={t('form.nameLabel')}
        placeholder={t('form.namePlaceholder')}
        autoCapitalize="words"
        returnKeyType="next"
        serverError={serverFields.name}
      />

      <FormField
        control={control}
        name="description"
        label={t('form.descriptionLabel')}
        placeholder={t('form.descriptionPlaceholder')}
        multiline
        numberOfLines={4}
        serverError={serverFields.description}
      />

      <Caption>{t('form.createDisclaimer')}</Caption>

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={t('form.submitCreate')}
          fullWidth
          loading={submitting}
          disabled={submitting || (needsApproval && !vetApproved)}
          onPress={handleSubmit(onSubmit)}
          accessibilityLabel={t('form.submitCreate')}
        />
      </View>
    </>
  );
}

function EditForm({
  defaultValues,
  submitting,
  formError,
  serverFields = {},
  onSubmit,
  t,
  theme,
}: EditProps & Ctx) {
  const schema = useMemo(() => buildEditOrganizationSchema(t), [t]);
  const { control, handleSubmit } = useForm<{ name: string; description: string }>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onTouched',
  });

  return (
    <>
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <FormField
        control={control}
        name="name"
        label={t('form.nameLabel')}
        placeholder={t('form.namePlaceholder')}
        autoCapitalize="words"
        returnKeyType="next"
        serverError={serverFields.name}
      />

      <FormField
        control={control}
        name="description"
        label={t('form.descriptionLabel')}
        placeholder={t('form.descriptionPlaceholder')}
        multiline
        numberOfLines={4}
        serverError={serverFields.description}
      />

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={t('form.submitSave')}
          fullWidth
          loading={submitting}
          disabled={submitting}
          onPress={handleSubmit(onSubmit)}
          accessibilityLabel={t('form.submitSave')}
        />
      </View>
    </>
  );
}
