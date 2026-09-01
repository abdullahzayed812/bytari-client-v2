import { Pressable, type PressableProps } from 'react-native';

import { Icon, type IconName } from '@/components/content/Icon';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

export interface TextButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  tone?: 'primary' | 'muted' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  underline?: boolean;
}

/** Low-emphasis inline action (links, "see all", form secondary actions). */
export function TextButton({
  label,
  tone = 'primary',
  icon,
  disabled,
  underline,
  ...rest
}: TextButtonProps) {
  const theme = useTheme();
  const color =
    tone === 'danger'
      ? theme.colors.danger
      : tone === 'muted'
        ? theme.colors.textSecondary
        : theme.colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={10}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.xs,
          alignSelf: 'flex-start',
        },
        pressed && { opacity: 0.6 },
        disabled && { opacity: 0.4 },
      ]}
      {...rest}
    >
      {icon ? <Icon name={icon} size="iconSm" style={{ color }} /> : null}
      <Text
        variant="label"
        style={[{ color }, underline && { textDecorationLine: 'underline' }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
