import { useMemo } from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Select, type SelectOption } from '@/components/forms';

import { COUNTRIES } from '../data/countries';

export interface CountrySelectProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
  serverError?: string;
}

/** Typed `Select<string>` wrapper bound to the static ISO-3166 country list. */
export function CountrySelect<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  serverError,
}: CountrySelectProps<T>) {
  const { i18n } = useTranslation();
  const useArabicNames = i18n.language !== 'en';

  const options = useMemo<SelectOption<string>[]>(
    () =>
      COUNTRIES.map((country) => ({
        value: country.code,
        label: useArabicNames ? country.nameAr : country.nameEn,
      })),
    [useArabicNames],
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState }) => (
        <Select
          label={label}
          placeholder={placeholder}
          value={typeof value === 'string' ? value : null}
          options={options}
          onChange={onChange}
          error={fieldState.error?.message ?? serverError}
        />
      )}
    />
  );
}
