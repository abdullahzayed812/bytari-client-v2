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

import { RegistrationSectionHeader } from './RegistrationSectionHeader';
import { COUNTRIES_AR } from '../data/countries';
import { ORG_TYPE_ORDER } from '../constants';
import {
  LICENSABLE_ORG_TYPES,
  PROFILE_FIELDS_ORG_TYPES,
  VET_APPROVAL_REQUIRED_TYPES,
  type OrganizationType,
} from '../types';
import {
  buildCreateOrganizationSchema,
  buildEditOrganizationSchema,
  type CreateOrganizationFormValues,
  type EditOrganizationFormValues,
} from '../validation/schemas';

const COUNTRY_OPTIONS = COUNTRIES_AR.map((c) => ({ label: c, value: c }));

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
  /** Which profile-field sections/fields render — a per-org-type UI decision. */
  orgType: OrganizationType;
  defaultValues: EditOrganizationFormValues;
  submitting: boolean;
  formError?: string | null;
  serverFields?: Record<string, string>;
  onSubmit: (values: EditOrganizationFormValues) => void;
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
  orgType,
  defaultValues,
  submitting,
  formError,
  serverFields = {},
  onSubmit,
  t,
  theme,
}: EditProps & Ctx) {
  const schema = useMemo(() => buildEditOrganizationSchema(t), [t]);
  const { control, handleSubmit } = useForm<EditOrganizationFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onTouched',
  });

  const hasProfileFields = PROFILE_FIELDS_ORG_TYPES.includes(orgType);
  const isLicensable = LICENSABLE_ORG_TYPES.includes(orgType);

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

      {hasProfileFields ? (
        <>
          <RegistrationSectionHeader
            icon="call-outline"
            title={t('registration.sections.contactInfo')}
          />
          <FormField
            control={control}
            name="address"
            label={t('registration.fields.address')}
            leftIcon="location-outline"
            serverError={serverFields.address}
          />
          <Controller
            control={control}
            name="country"
            render={({ field: { value, onChange }, fieldState }) => (
              <Select<string>
                label={t('registration.fields.country')}
                placeholder={t('registration.fields.countryPlaceholder')}
                value={value || null}
                options={COUNTRY_OPTIONS}
                onChange={onChange}
                error={fieldState.error?.message ?? serverFields.country}
              />
            )}
          />
          <FormField
            control={control}
            name="phone"
            label={t('registration.fields.phone')}
            leftIcon="call-outline"
            keyboardType="phone-pad"
            serverError={serverFields.phone}
          />
          <FormField
            control={control}
            name="email"
            label={t('registration.fields.email')}
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            serverError={serverFields.email}
          />
          <FormField
            control={control}
            name="workingHours"
            label={t('registration.fields.workingHours')}
            leftIcon="time-outline"
            serverError={serverFields.workingHours}
          />
          {orgType === 'CLINIC' ? (
            <FormField
              control={control}
              name="services"
              label={t('registration.fields.services')}
              leftIcon="medkit-outline"
              serverError={serverFields.services}
            />
          ) : null}

          <RegistrationSectionHeader
            icon="link-outline"
            title={t('registration.sections.contactLinks')}
          />
          <FormField
            control={control}
            name="websiteUrl"
            label={t('registration.fields.website')}
            leftIcon="globe-outline"
            autoCapitalize="none"
            keyboardType="url"
            serverError={serverFields.websiteUrl}
          />
          <FormField
            control={control}
            name="facebookUrl"
            label={t('registration.fields.facebook')}
            leftIcon="logo-facebook"
            autoCapitalize="none"
            keyboardType="url"
            serverError={serverFields.facebookUrl}
          />
          <FormField
            control={control}
            name="instagramUrl"
            label={t('registration.fields.instagram')}
            leftIcon="logo-instagram"
            autoCapitalize="none"
            keyboardType="url"
            serverError={serverFields.instagramUrl}
          />
          <FormField
            control={control}
            name="whatsapp"
            label={t('registration.fields.whatsapp')}
            leftIcon="logo-whatsapp"
            keyboardType="phone-pad"
            serverError={serverFields.whatsapp}
          />

          {isLicensable ? (
            <>
              <RegistrationSectionHeader
                icon="document-text-outline"
                title={t('registration.sections.licenseInfo')}
              />
              <FormField
                control={control}
                name="licenseNumber"
                label={t('registration.fields.licenseNumber')}
                leftIcon="document-text-outline"
                serverError={serverFields.licenseNumber}
              />
            </>
          ) : null}
        </>
      ) : null}

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
