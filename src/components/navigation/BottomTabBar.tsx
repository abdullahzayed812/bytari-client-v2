import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/content/Icon';
import { Text } from '@/components/typography';
import { useUiStore } from '@/store';
import { useTheme } from '@/theme';

/**
 * Custom bottom navigation matching the reference: five destinations with the
 * centre "Home" raised into a prominent circular button. Purely presentational —
 * it reads the router state Expo Router passes in and calls `navigation`.
 *
 * Route name → icon + i18n label key. Destination screens are placeholders in
 * Phase 1; the bar itself is final.
 */
type IconPair = { active: IconName; inactive: IconName };

const HOME_ICONS: IconPair = { active: 'home', inactive: 'home-outline' };
const ICONS: Record<string, IconPair> = {
  account: { active: 'person', inactive: 'person-outline' },
  animals: { active: 'paw', inactive: 'paw-outline' },
  index: HOME_ICONS,
  services: { active: 'grid', inactive: 'grid-outline' },
  more: { active: 'ellipsis-horizontal', inactive: 'ellipsis-horizontal-outline' },
};

const iconFor = (routeName: string): IconPair => ICONS[routeName] ?? HOME_ICONS;

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const badge = useUiStore((s) => s.notificationBadgeCount);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: Math.max(insets.bottom, theme.spacing.sm),
        paddingTop: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
        backgroundColor: theme.colors.tabBarBackground,
        borderTopWidth: theme.sizes.hairline,
        borderTopColor: theme.colors.divider,
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
        const isHome = route.name === 'index';
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

        if (isHome) {
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              style={{ alignItems: 'center', width: 72 }}
            >
              <View
                style={{
                  width: theme.sizes.tabBarHomeButton,
                  height: theme.sizes.tabBarHomeButton,
                  borderRadius: theme.radius.pill,
                  backgroundColor: theme.colors.tabBarHomeButton,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: -theme.spacing.xxl,
                  borderWidth: 4,
                  borderColor: theme.colors.background,
                  ...theme.shadows.raised,
                }}
              >
                <Icon name={icons.active} size="iconLg" color="onTabBarHomeButton" />
              </View>
              <Text
                variant="overline"
                style={{
                  marginTop: theme.spacing.xxs,
                  color: focused ? theme.colors.tabBarActive : theme.colors.tabBarInactive,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={onPress}
            style={{
              alignItems: 'center',
              flex: 1,
              rowGap: theme.spacing.xxs,
              paddingVertical: theme.spacing.xs,
            }}
          >
            <View>
              <Icon
                name={focused ? icons.active : icons.inactive}
                size="iconMd"
                color={focused ? 'tabBarActive' : 'tabBarInactive'}
              />
              {route.name === 'account' && badge > 0 ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -8,
                    minWidth: 16,
                    height: 16,
                    borderRadius: theme.radius.pill,
                    backgroundColor: theme.colors.danger,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 3,
                  }}
                >
                  <Text variant="overline" style={{ color: theme.colors.textInverse, fontSize: 9 }}>
                    {badge > 99 ? '99+' : badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              variant="overline"
              style={{ color: focused ? theme.colors.tabBarActive : theme.colors.tabBarInactive }}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
