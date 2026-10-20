import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { Text } from '@/components/typography';
import { physicalRow } from '@/lib/rtl';
import { useTheme } from '@/theme';

import { STORE_ACCENTS, type StoreAccent } from '../accents';

export interface StoreTopBarProps {
  title: string;
  subtitle?: string;
  cartCount: number;
  onCartPress: () => void;
  cartA11yLabel: string;
  /**
   * Category page: back button on the physical left, cart on the other side,
   * a tinted category icon next to the centred title.
   */
  back?: { a11yLabel: string; onPress?: () => void };
  /** Tinted icon next to the title (category pages). */
  icon?: IconName;
  /** Home variant: brand mark at the start. */
  logo?: ReactNode;
  accent?: StoreAccent;
}

/**
 * Store app bar of the references — centred title + subtitle, a cart icon
 * with a count badge, and either the store's brand mark (store home) or a
 * back button (category / product list). Logical layout on the home variant;
 * the back variant is pinned physically (back always on the left, lib/rtl).
 */
export function StoreTopBar({
  title,
  subtitle,
  cartCount,
  onCartPress,
  cartA11yLabel,
  back,
  icon,
  logo,
  accent = STORE_ACCENTS.green,
}: StoreTopBarProps) {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';

  const roundButton = {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: theme.colors.surface,
    borderWidth: back ? 1 : 0,
    borderColor: dark ? theme.colors.border : '#F1F5F9',
    ...(back ? theme.shadows.xs : null),
  };

  const cart = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={cartA11yLabel}
      onPress={onCartPress}
      hitSlop={6}
      style={({ pressed }) => [roundButton, pressed && { transform: [{ scale: 0.95 }] }]}
    >
      <Icon name="cart-outline" size="iconMd" color="textPrimary" />
      {cartCount > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: -2,
            end: -2,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 4,
            borderRadius: 9,
            borderWidth: 2,
            borderColor: theme.colors.surface,
            backgroundColor: back ? accent.main : '#E11D48',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 10,
              lineHeight: 12,
              color: '#FFFFFF',
              fontFamily: theme.fontFamily.displayBold,
            }}
          >
            {cartCount > 99 ? '99+' : String(cartCount)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );

  const center = (
    <View style={{ flex: 1, alignItems: 'center', minWidth: 0, paddingHorizontal: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6, maxWidth: '100%' }}>
        {icon ? (
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: dark ? theme.colors.surfaceAccent : accent.soft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={icon} size={16} color="textPrimary" />
          </View>
        ) : null}
        <Text
          numberOfLines={1}
          style={{
            fontFamily: theme.fontFamily.displayBold,
            fontSize: back ? 17 : 19,
            lineHeight: back ? 26 : 28,
            color: theme.colors.textPrimary,
            flexShrink: 1,
          }}
        >
          {title}
        </Text>
      </View>
      {subtitle ? (
        <Text
          numberOfLines={1}
          center
          style={{ fontSize: 11, lineHeight: 16, color: theme.colors.textMuted }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );

  if (back) {
    return (
      <View
        style={{
          flexDirection: physicalRow(),
          alignItems: 'center',
          columnGap: 8,
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 8,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={back.a11yLabel}
          onPress={back.onPress ?? (() => router.back())}
          hitSlop={6}
          style={({ pressed }) => [roundButton, pressed && { transform: [{ scale: 0.95 }] }]}
        >
          <Icon name="chevron-back" size="iconSm" color="textPrimary" />
        </Pressable>
        {center}
        {cart}
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 8,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 8,
      }}
    >
      <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        {logo}
      </View>
      {center}
      {cart}
    </View>
  );
}

/** Round brand mark for the store home bar (paw / medkit in the store green). */
export function StoreLogoMark({ icon }: { icon: IconName }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size="iconMd" color="onPrimary" />
    </View>
  );
}
