import { forwardRef } from 'react';
import type { TextInput } from 'react-native';

import { IconButton } from '@/components/actions';

import { Input, type InputProps } from './Input';

export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'rightSlot'> {
  onClear?: () => void;
}

/** Search field: leading magnifier + optional clear button. */
export const SearchInput = forwardRef<TextInput, SearchInputProps>(function SearchInput(
  { value, onClear, ...props },
  ref,
) {
  return (
    <Input
      ref={ref}
      value={value}
      leftIcon="search-outline"
      returnKeyType="search"
      autoCorrect={false}
      rightSlot={
        value && onClear ? (
          <IconButton
            icon="close-circle"
            size="sm"
            accessibilityLabel="Clear search"
            onPress={onClear}
          />
        ) : undefined
      }
      {...props}
    />
  );
});
