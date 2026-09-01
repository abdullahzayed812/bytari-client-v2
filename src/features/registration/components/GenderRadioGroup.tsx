import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Radio } from '@/components/forms';
import { Row } from '@/components/layout';
import { Caption, Label } from '@/components/typography';
import { useTheme } from '@/theme';

export interface GenderRadioGroupProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  serverError?: string;
}

/** RHF-bound أنثى/ذكر radio pair. Thin composition over `Radio` (Toggle.tsx). */
export function GenderRadioGroup<T extends FieldValues>({
  control,
  name,
  label,
  serverError,
}: GenderRadioGroupProps<T>) {
  const { t } = useTranslation('registration');
  const theme = useTheme();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState }) => (
        <View style={{ rowGap: theme.spacing.sm }}>
          {label ? <Label>{label}</Label> : null}
          <Row gap="xxl">
            <Radio
              label={t('petOwner.genderFemale')}
              checked={value === 'FEMALE'}
              onChange={() => onChange('FEMALE')}
            />
            <Radio
              label={t('petOwner.genderMale')}
              checked={value === 'MALE'}
              onChange={() => onChange('MALE')}
            />
          </Row>
          {(fieldState.error?.message ?? serverError) ? (
            <Caption color="danger">{fieldState.error?.message ?? serverError}</Caption>
          ) : null}
        </View>
      )}
    />
  );
}
