import { useTranslation } from 'react-i18next';

import { Input } from '@/components/forms';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value: string): boolean {
  return ISO_DATE.test(value);
}

export interface DateFieldInputProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

/**
 * A `YYYY-MM-DD` text field with a persistent format hint and an inline error
 * the moment the value stops matching — so an invalid date never just leaves
 * the submit button silently disabled with no explanation.
 */
export function DateFieldInput({
  label,
  value,
  onChangeText,
  placeholder = '2026-09-01',
  required,
}: DateFieldInputProps) {
  const { t } = useTranslation('poultry');
  const invalid = value.length > 0 && !isValidIsoDate(value);

  return (
    <Input
      label={label}
      placeholder={placeholder}
      hint={invalid ? undefined : t('common.dateFormatHint')}
      error={invalid ? t('common.dateFormatError') : undefined}
      value={value}
      onChangeText={onChangeText}
      autoCorrect={false}
      keyboardType="numbers-and-punctuation"
      required={required}
    />
  );
}
