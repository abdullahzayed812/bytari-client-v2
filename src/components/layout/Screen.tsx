import type { ReactNode } from 'react';
import {
  ScrollView,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export interface ScreenProps {
  children: ReactNode;
  /** Apply the standard horizontal screen padding. Default `true`. */
  padded?: boolean;
  /** Background token. Default `background`. */
  background?: 'background' | 'surface' | 'surfaceAccent' | 'surfaceMuted';
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Safe-area edges to inset. Default `['top']` (bottom is the tab bar's job). */
  edges?: Edge[];
}

/** Non-scrolling screen container with safe-area handling + themed background. */
export function Screen({
  children,
  padded = true,
  background = 'background',
  style,
  contentStyle,
  edges = ['top'],
}: ScreenProps) {
  const theme = useTheme();
  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, backgroundColor: theme.colors[background] }, style]}
    >
      <View
        style={[{ flex: 1 }, padded && { paddingHorizontal: theme.screenPadding }, contentStyle]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

export interface ScrollScreenProps extends ScreenProps {
  scrollProps?: Omit<ScrollViewProps, 'style' | 'contentContainerStyle'>;
}

/** Scrolling variant — use for content that can exceed the viewport. */
export function ScrollScreen({
  children,
  padded = true,
  background = 'background',
  style,
  contentStyle,
  edges = ['top'],
  scrollProps,
}: ScrollScreenProps) {
  const theme = useTheme();
  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, backgroundColor: theme.colors[background] }, style]}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          { paddingBottom: theme.spacing.huge, flexGrow: 1 },
          padded && { paddingHorizontal: theme.screenPadding },
          contentStyle,
        ]}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Explicit full-bleed safe-area wrapper (no padding, all edges). */
export function SafeAreaScreen({ children, style }: Pick<ScreenProps, 'children' | 'style'>) {
  const theme = useTheme();
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: theme.colors.background }, style]}>
      {children}
    </SafeAreaView>
  );
}
