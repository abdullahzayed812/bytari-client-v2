import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import type { SpacingToken } from '@/theme/spacing';

export interface CardProps {
  children: ReactNode;
  padding?: SpacingToken;
  variant?: 'elevated' | 'outlined' | 'accent' | 'flat';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Rounded surface with a soft shadow — the core content container. */
export function Card({
  children,
  padding = 'lg',
  variant = 'elevated',
  onPress,
  style,
  accessibilityLabel,
}: CardProps) {
  const theme = useTheme();

  const surfaceStyle: ViewStyle = {
    borderRadius: theme.radius.xl,
    padding: theme.spacing[padding],
    backgroundColor: variant === 'accent' ? theme.colors.surfaceAccent : theme.colors.surface,
    borderWidth: variant === 'outlined' ? 1 : 0,
    borderColor: theme.colors.border,
    ...(variant === 'elevated' ? theme.shadows.card : theme.shadows.none),
  };

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [surfaceStyle, pressed && { opacity: 0.9 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[surfaceStyle, style]}>{children}</View>;
}
