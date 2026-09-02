import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormField, Select } from '@/components/forms';

import { HEALTH_STATUS_OPTIONS, VACCINATION_STATUS_OPTIONS } from '../constants';
import type { HealthStatus, PublicationKind, VaccinationStatus } from '../types';

export interface PublicationListingFieldsFormProps<T extends FieldValues> {
  kind: PublicationKind;
  control: Control<T>;
  serverFields?: Record<string, string>;
}

/**
 * The listing-specific fields — genuinely different per kind, matching the
 * reference forms exactly. Shared between the full "Add X Animal" screen
 * (`CreatePublicationScreen`) and the existing-pet `PublishAnimalScreen`.
 */
export function PublicationListingFieldsForm<T extends FieldValues>({
  kind,
  control,
  serverFields = {},
}: PublicationListingFieldsFormProps<T>) {
  const { t } = useTranslation('publications');

  if (kind === 'LOST') {
    return (
      <>
        <FormField
          control={control}
          name={'lostDate' as FieldPath<T>}
          label={t('form.lostDateLabel')}
          placeholder={t('form.lostDatePlaceholder')}
          hint={t('form.dateHint')}
          keyboardType="numbers-and-punctuation"
          returnKeyType="next"
          required
          serverError={serverFields.lostDate}
        />
        <FormField
          control={control}
          name={'lostTime' as FieldPath<T>}
          label={t('form.lostTimeLabel')}
          placeholder={t('form.lostTimePlaceholder')}
          keyboardType="numbers-and-punctuation"
          returnKeyType="next"
          serverError={serverFields.lostTime}
        />
        <FormField
          control={control}
          name={'lostGovernorate' as FieldPath<T>}
          label={t('form.governorateLabel')}
          placeholder={t('form.governoratePlaceholder')}
          returnKeyType="next"
          required
          serverError={serverFields.lostGovernorate}
        />
        <FormField
          control={control}
          name={'lostDistrict' as FieldPath<T>}
          label={t('form.districtLabel')}
          placeholder={t('form.districtPlaceholder')}
          returnKeyType="next"
          required
          serverError={serverFields.lostDistrict}
        />
        <FormField
          control={control}
          name={'lostLocationDetail' as FieldPath<T>}
          label={t('form.locationDetailLabel')}
          placeholder={t('form.locationDetailPlaceholder')}
          returnKeyType="next"
          serverError={serverFields.lostLocationDetail}
        />
        <FormField
          control={control}
          name={'note' as FieldPath<T>}
          label={t('form.additionalInfoLabel')}
          placeholder={t('form.additionalInfoPlaceholder')}
          multiline
          numberOfLines={3}
          serverError={serverFields.note}
        />
        <FormField
          control={control}
          name={'healthNotes' as FieldPath<T>}
          label={t('form.healthNotesLabel')}
          placeholder={t('form.healthNotesPlaceholder')}
          multiline
          numberOfLines={3}
          serverError={serverFields.healthNotes}
        />
        <FormField
          control={control}
          name={'contactName' as FieldPath<T>}
          label={t('form.contactNameLabel')}
          placeholder={t('form.contactNamePlaceholder')}
          autoCapitalize="words"
          returnKeyType="next"
          required
          serverError={serverFields.contactName}
        />
        <FormField
          control={control}
          name={'contactPhone' as FieldPath<T>}
          label={t('form.contactPhoneLabel')}
          placeholder={t('form.contactPhonePlaceholder')}
          keyboardType="phone-pad"
          required
          serverError={serverFields.contactPhone}
        />
      </>
    );
  }

  // ADOPTION / MATING share the same field set, minus isSterilized for MATING.
  return (
    <>
      <FormField
        control={control}
        name={'note' as FieldPath<T>}
        label={t('form.descriptionLabel')}
        placeholder={t('form.descriptionPlaceholder')}
        multiline
        numberOfLines={4}
        required={kind === 'ADOPTION'}
        serverError={serverFields.note}
      />
      <FormField
        control={control}
        name={'extraNotes' as FieldPath<T>}
        label={t('form.notesLabel')}
        placeholder={t('form.notesPlaceholder')}
        multiline
        numberOfLines={3}
        serverError={serverFields.extraNotes}
      />
      <FormField
        control={control}
        name={'city' as FieldPath<T>}
        label={t('form.cityLabel')}
        placeholder={t('form.cityPlaceholder')}
        returnKeyType="next"
        required
        serverError={serverFields.city}
      />
      <Controller
        control={control}
        name={'healthStatus' as FieldPath<T>}
        render={({ field: { value, onChange }, fieldState }) => (
          <Select<HealthStatus>
            label={t('form.healthStatusLabel')}
            placeholder={t('form.healthStatusPlaceholder')}
            value={(value as HealthStatus) ?? null}
            options={HEALTH_STATUS_OPTIONS.map((s) => ({
              value: s,
              label: t(`healthStatus.${s}`),
            }))}
            onChange={onChange}
            error={fieldState.error?.message ?? serverFields.healthStatus}
          />
        )}
      />
      <Controller
        control={control}
        name={'vaccinationStatus' as FieldPath<T>}
        render={({ field: { value, onChange }, fieldState }) => (
          <Select<VaccinationStatus>
            label={t('form.vaccinationStatusLabel')}
            placeholder={t('form.vaccinationStatusPlaceholder')}
            value={(value as VaccinationStatus) ?? null}
            options={VACCINATION_STATUS_OPTIONS.map((s) => ({
              value: s,
              label: t(`vaccinationStatus.${s}`),
            }))}
            onChange={onChange}
            error={fieldState.error?.message ?? serverFields.vaccinationStatus}
          />
        )}
      />
      {kind === 'ADOPTION' ? (
        <Controller
          control={control}
          name={'isSterilized' as FieldPath<T>}
          render={({ field: { value, onChange }, fieldState }) => (
            <Select<'true' | 'false'>
              label={t('form.sterilizedLabel')}
              placeholder={t('form.sterilizedPlaceholder')}
              value={(value as 'true' | 'false') ?? null}
              options={[
                { value: 'true', label: t('form.yes') },
                { value: 'false', label: t('form.no') },
              ]}
              onChange={onChange}
              error={fieldState.error?.message ?? serverFields.isSterilized}
            />
          )}
        />
      ) : null}
      <FormField
        control={control}
        name={'contactName' as FieldPath<T>}
        label={t('form.contactNameLabel')}
        placeholder={t('form.contactNamePlaceholder')}
        autoCapitalize="words"
        returnKeyType="next"
        required
        serverError={serverFields.contactName}
      />
      <FormField
        control={control}
        name={'contactPhone' as FieldPath<T>}
        label={t('form.contactPhoneLabel')}
        placeholder={t('form.contactPhonePlaceholder')}
        keyboardType="phone-pad"
        required
        serverError={serverFields.contactPhone}
      />
    </>
  );
}
