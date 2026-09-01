import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { Input, type InputProps } from './Input';
import { PasswordInput } from './PasswordInput';

type FieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  /** Backend (422) error for this field, shown when there is no local error. */
  serverError?: string;
  secure?: boolean;
} & Omit<InputProps, 'value' | 'onChangeText' | 'onBlur' | 'error'>;

/**
 * Glue between React Hook Form and the design-system `Input` / `PasswordInput`.
 * Keeps controlled-input wiring out of screens.
 */
export function FormField<T extends FieldValues>({
  control,
  name,
  serverError,
  secure,
  ...inputProps
}: FieldProps<T>) {
  const Field = secure ? PasswordInput : Input;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState }) => (
        <Field
          {...inputProps}
          value={typeof value === 'string' ? value : ''}
          onChangeText={onChange}
          onBlur={onBlur}
          error={fieldState.error?.message ?? serverError}
        />
      )}
    />
  );
}
