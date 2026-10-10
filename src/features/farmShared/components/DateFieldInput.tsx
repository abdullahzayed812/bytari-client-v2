import { useTranslation } from 'react-i18next';

import { Input } from '@/components/forms';
import { isValidIsoDate } from '@/utils';

/** Re-exported for the farm screens' submit gates — padded or unpadded, real calendar dates only. */
export { isValidIsoDate };

export interface DateFieldInputProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

/**
 * A `YYYY-MM-DD` (or `YYYY-M-D`) text field with a persistent format hint and an inline error
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
