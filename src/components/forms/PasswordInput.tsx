import { forwardRef, useState } from 'react';
import type { TextInput } from 'react-native';

import { IconButton } from '@/components/actions';

import { Input, type InputProps } from './Input';

export type PasswordInputProps = Omit<InputProps, 'secureTextEntry' | 'rightSlot'>;

/** Text field with a masked value and a show/hide toggle. */
export const PasswordInput = forwardRef<TextInput, PasswordInputProps>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <Input
        ref={ref}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        leftIcon="lock-closed-outline"
        rightSlot={
          <IconButton
            icon={visible ? 'eye-off-outline' : 'eye-outline'}
            size="sm"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            onPress={() => setVisible((v) => !v)}
          />
        }
        {...props}
      />
    );
  },
);
