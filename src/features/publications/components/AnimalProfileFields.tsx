import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormField, Select } from '@/components/forms';
import { SEX_OPTIONS, SPECIES_OPTIONS } from '@/features/pets/constants';
import type { PetSex, PetSpecies } from '@/features/pets/types';

import { AGE_ESTIMATE_OPTIONS } from '../constants';
import type { AgeEstimate } from '../types';

export interface AnimalProfileFieldsProps<T extends FieldValues> {
  control: Control<T>;
  serverFields?: Record<string, string>;
}

/**
 * The animal-profile half of the "Add Lost / Adoption / Mating Animal" form —
 * species / breed / name / sex / color / age / distinguishing features.
 * These map directly onto `POST /animals` (reused as-is, not duplicated) —
 * only `PublishAnimalScreen` (an existing pet) skips this half.
 */
export function AnimalProfileFields<T extends FieldValues>({
  control,
  serverFields = {},
}: AnimalProfileFieldsProps<T>) {
  const { t } = useTranslation('publications');
  const { t: tp } = useTranslation('pets');

  return (
    <>
      <Controller
        control={control}
        name={'species' as FieldPath<T>}
        render={({ field: { value, onChange }, fieldState }) => (
          <Select<PetSpecies>
            label={t('form.speciesLabel')}
            placeholder={t('form.speciesPlaceholder')}
            value={(value as PetSpecies) ?? null}
            options={SPECIES_OPTIONS.map((s) => ({ value: s, label: tp(`species.${s}`) }))}
            onChange={onChange}
            error={fieldState.error?.message ?? serverFields.species}
          />
        )}
      />
      <FormField
        control={control}
        name={'breed' as FieldPath<T>}
        label={t('form.breedLabel')}
        placeholder={t('form.breedPlaceholder')}
        returnKeyType="next"
        serverError={serverFields.breed}
      />
      <FormField
        control={control}
        name={'name' as FieldPath<T>}
        label={t('form.nameLabel')}
        placeholder={t('form.namePlaceholder')}
        autoCapitalize="words"
        returnKeyType="next"
        serverError={serverFields.name}
      />
      <Controller
        control={control}
        name={'sex' as FieldPath<T>}
        render={({ field: { value, onChange }, fieldState }) => (
          <Select<PetSex>
            label={t('form.sexLabel')}
            placeholder={t('form.sexPlaceholder')}
            value={(value as PetSex) ?? null}
            options={SEX_OPTIONS.map((s) => ({ value: s, label: tp(`sex.${s}`) }))}
            onChange={onChange}
            error={fieldState.error?.message ?? serverFields.sex}
          />
        )}
      />
      <FormField
        control={control}
        name={'color' as FieldPath<T>}
        label={t('form.colorLabel')}
        placeholder={t('form.colorPlaceholder')}
        returnKeyType="next"
        serverError={serverFields.color}
      />
      <Controller
        control={control}
        name={'ageEstimate' as FieldPath<T>}
        render={({ field: { value, onChange }, fieldState }) => (
          <Select<AgeEstimate>
            label={t('form.ageEstimateLabel')}
            placeholder={t('form.ageEstimatePlaceholder')}
            value={(value as AgeEstimate) ?? null}
            options={AGE_ESTIMATE_OPTIONS.map((a) => ({ value: a, label: t(`ageEstimate.${a}`) }))}
            onChange={onChange}
            error={fieldState.error?.message ?? serverFields.ageEstimate}
          />
        )}
      />
      <FormField
        control={control}
        name={'distinguishingFeatures' as FieldPath<T>}
        label={t('form.distinguishingFeaturesLabel')}
        placeholder={t('form.distinguishingFeaturesPlaceholder')}
        serverError={serverFields.distinguishingFeatures}
      />
    </>
  );
}
