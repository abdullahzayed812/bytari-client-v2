import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/content/Icon';
import { Text } from '@/components/typography';
import { useUiStore } from '@/store';
import { useTheme } from '@/theme';

/**
 * Custom bottom navigation matching the reference: a floating pill of five
 * icon-only destinations. There's no fixed "Home button" widget — whichever
 * tab is currently focused springs up into the large raised brand-green
 * circle; every other tab sits at rest as a small outlined chip. Home just
 * happens to be the initial focused tab, so it reads the same as before by
 * default. Accessible names are still attached via `accessibilityLabel` even
 * though no label renders visually.
 *
 * Purely presentational — reads the router state Expo Router passes in and
 * calls `navigation`. The icon set below is Pet-Owner-specific; other roles
 * (e.g. veterinarian) will get their own icon set later, sharing this same
 * shell and focus-follows-the-active-tab behaviour.
 *
 * Route name → icon. Destination screens are placeholders in Phase 1; the
 * bar itself is final.
 */
type IconPair = { active: IconName; inactive: IconName };

const ICONS: Record<string, IconPair> = {
  account: { active: 'person', inactive: 'person-outline' },
  animals: { active: 'paw', inactive: 'paw-outline' },
  index: { active: 'home', inactive: 'home-outline' },
  services: { active: 'grid', inactive: 'grid-outline' },
  more: { active: 'bag-handle', inactive: 'bag-handle-outline' },
};

const iconFor = (routeName: string): IconPair =>
  ICONS[routeName] ?? { active: 'ellipse', inactive: 'ellipse-outline' };

interface AnimatedTabButtonProps {
  focused: boolean;
  restIcon: IconName;
  activeIcon: IconName;
}

/**
 * A single tab's animated visual: springs between a small outlined chip
 * (at rest) and the large raised gradient circle (focused), cross-fading
 * the gradient fill, the ring border and the two icon glyphs as it goes.
 */
function AnimatedTabButton({ focused, restIcon, activeIcon }: AnimatedTabButtonProps) {
  const theme = useTheme();
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, { damping: 16, stiffness: 200 });
  }, [focused, progress]);

  const restSize = theme.sizes.tabBarChip;
  const activeSize = theme.sizes.tabBarHomeButton;
  const lift = theme.spacing.xxl;

  const containerStyle = useAnimatedStyle(() => {
    const size = restSize + (activeSize - restSize) * progress.value;
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 4 * progress.value,
      transform: [{ translateY: -lift * progress.value }],
    };
  });

  const gradientStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const restIconStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const activeIconStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Animated.View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: theme.colors.tabBarChipBackground,
          borderColor: theme.colors.tabBarHomeButtonRing,
        },
        focused ? theme.shadows.glow : theme.shadows.xs,
        containerStyle,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, gradientStyle]}>
        <LinearGradient
          colors={[theme.colors.tabBarHomeButtonFrom, theme.colors.tabBarHomeButtonTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        style={[StyleSheet.absoluteFill, restIconStyle, { alignItems: 'center', justifyContent: 'center' }]}
      >
        <Icon name={restIcon} size="iconMd" color="tabBarActive" />
      </Animated.View>
      <Animated.View
        style={[StyleSheet.absoluteFill, activeIconStyle, { alignItems: 'center', justifyContent: 'center' }]}
      >
        <Icon name={activeIcon} size="iconLg" color="onTabBarHomeButton" />
      </Animated.View>
    </Animated.View>
  );
}

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const badge = useUiStore((s) => s.notificationBadgeCount);

  return (
    <View
      style={{
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: Math.max(insets.bottom, theme.spacing.md),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: theme.sizes.tabBarHeight,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.tabBarBackground,
          paddingHorizontal: theme.spacing.sm,
          ...theme.shadows.raised,
        }}
      >
        {state.routes.map((route, index) => {
          const options = descriptors[route.key]?.options;
          const label: string =
            typeof options?.tabBarLabel === 'string'
              ? options.tabBarLabel
              : (options?.title ?? route.name);
          const focused = state.index === index;
          const icons = iconFor(route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params as object | undefined);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              hitSlop={8}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <AnimatedTabButton focused={focused} restIcon={icons.inactive} activeIcon={icons.active} />
              {route.name === 'account' && badge > 0 ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: theme.spacing.md,
                    minWidth: 16,
                    height: 16,
                    borderRadius: theme.radius.pill,
                    backgroundColor: theme.colors.danger,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 3,
                    borderWidth: 2,
                    borderColor: theme.colors.tabBarBackground,
                  }}
                >
                  <Text variant="overline" style={{ color: theme.colors.textInverse, fontSize: 9 }}>
                    {badge > 99 ? '99+' : badge}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
