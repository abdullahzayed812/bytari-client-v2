import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/typography';
import { isRTL } from '@/lib/rtl';
import { useTheme } from '@/theme';

import { BackButton } from './BackButton';

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  /** Trailing action(s), e.g. an `IconButton`. */
  right?: ReactNode;
  /** Leading override (replaces the back button / spacer). */
  left?: ReactNode;
  transparent?: boolean;
  /**
   * Where the leading slot (back button) sits. `start` (default) is the
   * logical RTL position — physical right in Arabic. `left` pins it to the
   * physical left edge regardless of language, matching the auth-flow
   * reference designs, which keep back navigation top-left in both languages.
   */
  backAlign?: 'start' | 'left';
  /** Makes the title tappable (e.g. a chat room name → its info screen). */
  onTitlePress?: () => void;
  /** Screen-reader hint for {@link onTitlePress}. */
  titleAccessibilityHint?: string;
}

/** App bar. Layout is logical, so leading/trailing swap sides correctly in RTL. */
export function AppHeader({
  title,
  subtitle,
  showBack,
  onBack,
  right,
  left,
  transparent,
  backAlign = 'start',
  onTitlePress,
  titleAccessibilityHint,
}: AppHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // Forcing the opposite of the native row-flip cancels it out, pinning the
  // leading slot to the physical left in both LTR and RTL.
  const pinLeft = backAlign === 'left';
  const flexDirection = pinLeft && isRTL() ? 'row-reverse' : 'row';

  return (
    <View
      style={{
        paddingTop: insets.top + theme.spacing.xs,
        paddingBottom: theme.spacing.md,
        paddingHorizontal: theme.screenPadding,
        backgroundColor: transparent ? 'transparent' : theme.colors.background,
        borderBottomWidth: transparent ? 0 : theme.sizes.hairline,
        borderBottomColor: theme.colors.divider,
        flexDirection,
        alignItems: 'center',
        columnGap: theme.spacing.sm,
        minHeight: theme.sizes.headerHeight + insets.top,
      }}
    >
      <View style={{ width: 40, alignItems: 'flex-start' }}>
        {left ?? (showBack ? <BackButton onPress={onBack} directional={!pinLeft} /> : null)}
      </View>

      <Pressable
        disabled={!onTitlePress}
        onPress={onTitlePress}
        accessibilityRole={onTitlePress ? 'button' : undefined}
        accessibilityHint={onTitlePress ? titleAccessibilityHint : undefined}
        hitSlop={8}
        style={({ pressed }) => [
          { flex: 1, alignItems: 'center' },
          onTitlePress && pressed ? { opacity: 0.6 } : null,
        ]}
      >
        {title ? (
          <Text variant="subtitle" weight="bold" numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </Pressable>

      <View style={{ alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}
