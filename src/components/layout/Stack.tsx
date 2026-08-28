import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import type { SpacingToken } from '@/theme/spacing';

interface BaseProps {
  children: ReactNode;
  gap?: SpacingToken;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  wrap?: boolean;
  flex?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * `Row` / `Column` use logical flex direction. In an RTL layout React Native
 * already flips `row` visually, so children flow start→end correctly without any
 * manual reversing.
 */
export function Row({
  children,
  gap = 'none',
  align = 'center',
  justify,
  wrap,
  flex,
  style,
}: BaseProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? 'wrap' : 'nowrap',
          columnGap: theme.spacing[gap],
          rowGap: theme.spacing[gap],
        },
        flex !== undefined && { flex },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Column({
  children,
  gap = 'none',
  align,
  justify,
  flex,
  style,
}: Omit<BaseProps, 'wrap'>) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'column',
          alignItems: align,
          justifyContent: justify,
          rowGap: theme.spacing[gap],
        },
        flex !== undefined && { flex },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export interface SectionProps {
  children: ReactNode;
  /** Vertical rhythm below the section. */
  spacing?: SpacingToken;
  style?: StyleProp<ViewStyle>;
}

/** A vertical content block with consistent bottom spacing. */
export function Section({ children, spacing = 'xxl', style }: SectionProps) {
  const theme = useTheme();
  return <View style={[{ marginBottom: theme.spacing[spacing] }, style]}>{children}</View>;
}
