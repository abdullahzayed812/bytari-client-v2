import { useEffect, useMemo, useRef } from 'react';
import {
  useController,
  useWatch,
  type Control,
  type FieldPath,
  type FieldValues,
  type PathValue,
} from 'react-hook-form';

import { FormField, Select, type SelectOption } from '@/components/forms';
import { governoratesFor } from '@/constants/governorates';

export interface GovernorateSelectProps<T extends FieldValues> {
  control: Control<T>;
  /** The governorate field. */
  name: FieldPath<T>;
  /** The country field this governorate depends on. */
  countryName: FieldPath<T>;
  label?: string;
  placeholder?: string;
  /** Shown instead of the picker until a country is chosen. */
  selectCountryFirst?: string;
  serverError?: string;
}

/**
 * Country → governorate. Becomes available once a country is picked: a fixed
 * picker for countries with a known list (Iraq), a free-text field otherwise.
 * Changing the country clears a governorate that belonged to the old one.
 */
export function GovernorateSelect<T extends FieldValues>({
  control,
  name,
  countryName,
  label,
  placeholder,
  selectCountryFirst,
  serverError,
}: GovernorateSelectProps<T>) {
  const country = useWatch({ control, name: countryName }) as unknown;
  const countryCode = typeof country === 'string' ? country : null;
  const list = governoratesFor(countryCode);
  const { field, fieldState } = useController({ control, name });

  const previousCountry = useRef(countryCode);
  useEffect(() => {
    if (previousCountry.current !== countryCode) {
      previousCountry.current = countryCode;
      field.onChange('' as PathValue<T, FieldPath<T>>);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only on a country change
  }, [countryCode]);

  const options = useMemo<SelectOption<string>[]>(
    () => (list ?? []).map((g) => ({ value: g, label: g })),
    [list],
  );

  if (!countryCode) {
    return (
      <Select
        label={label}
        placeholder={selectCountryFirst ?? placeholder}
        value={null}
        options={[]}
        onChange={() => undefined}
        disabled
        required
      />
    );
  }

  if (list) {
    return (
      <Select
        label={label}
        placeholder={placeholder}
        value={typeof field.value === 'string' && field.value ? field.value : null}
        options={options}
        onChange={field.onChange}
        error={fieldState.error?.message ?? serverError}
        required
      />
    );
  }

  return (
    <FormField
      control={control}
      name={name}
      label={label}
      placeholder={placeholder}
      autoCapitalize="words"
      returnKeyType="next"
      serverError={serverError}
    />
  );
}
