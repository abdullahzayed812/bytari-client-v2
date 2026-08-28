import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { flipForDirection } from '@/lib/rtl';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/colors';
import type { SizeToken } from '@/theme/sizes';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export interface IconProps {
  name: IconName;
  size?: SizeToken | number;
  color?: keyof ColorTokens;
  /** Mirror the glyph in RTL (use for chevrons / back arrows / send). */
  directional?: boolean;
  style?: StyleProp<TextStyle>;
}

/**
 * Single icon abstraction over `@expo/vector-icons` (Ionicons — line style, to
 * match the green outline-icon design language). Swapping icon sets later is a
 * one-file change.
 */
export function Icon({
  name,
  size = 'iconMd',
  color = 'textPrimary',
  directional,
  style,
}: IconProps) {
  const theme = useTheme();
  const resolvedSize = typeof size === 'number' ? size : theme.sizes[size];
  return (
    <Ionicons
      name={name}
      size={resolvedSize}
      color={theme.colors[color]}
      style={[directional && flipForDirection(), style]}
    />
  );
}
