import { forwardRef, useState } from 'react';
import { TextInput, View, type TextInputProps, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/content/Icon';
import { Caption, Label, Text } from '@/components/typography';
import { isRTL } from '@/lib/rtl';
import { useTheme } from '@/theme';

export interface InputProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: IconName;
  /** Interactive content in the leading icon slot (e.g. a password show/hide toggle). Takes precedence over `leftIcon`. */
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  required?: boolean;
}

/** Themed text field. Base for `PasswordInput` / `SearchInput`. RTL-aware alignment. */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    hint,
    error,
    leftIcon,
    leftSlot,
    rightSlot,
    containerStyle,
    required,
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <View style={[{ rowGap: theme.spacing.xs }, containerStyle]}>
      {label ? (
        <Label>
          {label}
          {required ? <Text color="danger"> *</Text> : null}
        </Label>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.sm,
          minHeight: theme.sizes.controlHeightMd,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.radius.lg,
          borderWidth: 1.5,
          borderColor,
          backgroundColor: theme.colors.surface,
        }}
      >
        {leftSlot ?? (leftIcon ? <Icon name={leftIcon} size="iconSm" color="textMuted" /> : null)}
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.primary}
          style={{
            flex: 1,
            paddingVertical: theme.spacing.sm,
            fontFamily: theme.fontFamily.bodyRegular,
            fontSize: theme.typography.body.fontSize,
            color: theme.colors.textPrimary,
            textAlign: isRTL() ? 'right' : 'left',
          }}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {rightSlot}
      </View>

      {error ? <Caption color="danger">{error}</Caption> : hint ? <Caption>{hint}</Caption> : null}
    </View>
  );
});
