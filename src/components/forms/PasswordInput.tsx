import { forwardRef, useState } from 'react';
import type { TextInput } from 'react-native';

import { IconButton } from '@/components/actions';

import { Input, type InputProps } from './Input';

export type PasswordInputProps = Omit<InputProps, 'secureTextEntry' | 'leftIcon' | 'leftSlot'>;

/**
 * Text field with a masked value and a show/hide toggle. The eye glyph is the
 * field's only icon (doubles as the "this is a password" affordance) — no
 * separate lock icon, matching the reference design.
 */
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
        leftSlot={
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
