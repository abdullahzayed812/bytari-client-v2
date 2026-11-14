import { useMemo } from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { FormField, Select, type SelectOption } from '@/components/forms';
import { physicalRow } from '@/lib/rtl';
import { useTheme } from '@/theme';

import { CALLING_CODES } from '../data/callingCodes';

/**
 * LRM before the `+`: keeps `+964` reading left-to-right inside Arabic / RTL
 * text (otherwise the bidi algorithm renders it as `964+`).
 */
const LRM = '‎';
const CODE_COLUMN_WIDTH = 112;

export interface PhoneNumberFieldProps<T extends FieldValues> {
  control: Control<T>;
  /** RHF field holding the ISO code of the calling code (e.g. `IQ` → +964). */
  countryName: FieldPath<T>;
  /** RHF field holding the national number (no calling code). */
  phoneName: FieldPath<T>;
  label: string;
  /** Backend (422) error for the combined `phone`. */
  serverError?: string;
  editable?: boolean;
}

/**
 * Registration phone input: a calling-code picker (`Select`, searchable by
 * country name or dial code; Iraq +964 is the form default) beside the
 * national-number `FormField`. Laid out in PHYSICAL left-to-right order in
 * both directions — phone numbers are read `+964 770…` — the same
 * `physicalRow` convention the back buttons use. The two values are joined
 * into one international number on submit (`toInternationalPhone`).
 */
export function PhoneNumberField<T extends FieldValues>({
  control,
  countryName,
  phoneName,
  label,
  serverError,
  editable = true,
}: PhoneNumberFieldProps<T>) {
  const theme = useTheme();
  const { t, i18n } = useTranslation('registration');
  const useArabicNames = i18n.language !== 'en';

  const options = useMemo<SelectOption<string>[]>(
    () =>
      CALLING_CODES.map((country) => ({
        value: country.code,
        label: useArabicNames ? country.nameAr : country.nameEn,
        description: `${LRM}+${country.dial}`,
      })),
    [useArabicNames],
  );

  return (
    <View
      style={{
        flexDirection: physicalRow(),
        alignItems: 'flex-start',
        columnGap: theme.spacing.sm,
      }}
    >
      <View style={{ width: CODE_COLUMN_WIDTH }}>
        <Controller
          control={control}
          name={countryName}
          render={({ field: { value, onChange }, fieldState }) => (
            <Select
              label={t('phoneField.countryCodeLabel')}
              value={typeof value === 'string' ? value : null}
              options={options}
              onChange={onChange}
              searchable
              disabled={!editable}
              valueLabel={(option) => option.description ?? option.label}
              error={fieldState.error?.message}
            />
          )}
        />
      </View>
      <View style={{ flex: 1 }}>
        <FormField
          control={control}
          name={phoneName}
          label={label}
          placeholder={t('phoneField.placeholder')}
          hint={t('phoneField.hint')}
          keyboardType="phone-pad"
          autoComplete="tel-national"
          textContentType="telephoneNumber"
          returnKeyType="next"
          leftIcon="phone-portrait-outline"
          serverError={serverError}
          editable={editable}
        />
      </View>
    </View>
  );
}
