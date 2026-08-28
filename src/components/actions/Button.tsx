import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';

import { Icon, type IconName } from '@/components/content/Icon';
import { Text } from '@/components/typography';
import { useTheme, type Theme } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
}

function palette(theme: Theme, variant: ButtonVariant) {
  const c = theme.colors;
  switch (variant) {
    case 'primary':
      return { bg: c.primary, bgPressed: c.primaryPressed, fg: c.onPrimary, border: 'transparent' };
    case 'secondary':
      return {
        bg: c.surfaceAccent,
        bgPressed: c.primarySoft,
        fg: c.primaryHover,
        border: 'transparent',
      };
    case 'outline':
      return { bg: 'transparent', bgPressed: c.primarySoft, fg: c.primary, border: c.primary };
    case 'ghost':
      return { bg: 'transparent', bgPressed: c.surfaceMuted, fg: c.primary, border: 'transparent' };
    case 'danger':
      return { bg: c.danger, bgPressed: c.danger, fg: c.textInverse, border: 'transparent' };
  }
}

const HEIGHT: Record<ButtonSize, keyof Theme['sizes']> = {
  sm: 'controlHeightSm',
  md: 'controlHeightMd',
  lg: 'controlHeightLg',
};

/** Primary interactive control. Green filled by default; use variants sparingly. */
export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  accessibilityLabel,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const colors = palette(theme, variant);
  const isDisabled = disabled || loading;
  const height = theme.sizes[HEIGHT[size]];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={6}
      style={({ pressed }) => [
        {
          minHeight: height,
          paddingHorizontal: size === 'sm' ? theme.spacing.lg : theme.spacing.xl,
          borderRadius: theme.radius.lg,
          borderWidth: colors.border === 'transparent' ? 0 : 1.5,
          borderColor: colors.border,
          backgroundColor: pressed ? colors.bgPressed : colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          columnGap: theme.spacing.sm,
        },
        fullWidth && { alignSelf: 'stretch' },
        isDisabled && { opacity: 0.45 },
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={colors.fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
          {leftIcon ? (
            <Icon name={leftIcon} size="iconSm" color="textPrimary" style={{ color: colors.fg }} />
          ) : null}
          <Text
            variant={size === 'sm' ? 'label' : 'bodyMedium'}
            style={{ color: colors.fg }}
            numberOfLines={1}
          >
            {label}
          </Text>
          {rightIcon ? (
            <Icon name={rightIcon} size="iconSm" directional style={{ color: colors.fg }} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
