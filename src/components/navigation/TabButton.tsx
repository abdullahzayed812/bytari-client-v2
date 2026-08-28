import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content/Icon';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

export interface TabButtonProps {
  label: string;
  icon: IconName;
  activeIcon?: IconName;
  active?: boolean;
  badgeCount?: number;
  onPress: () => void;
}

/**
 * Standalone tab item — used by `BottomTabBar`, and reusable for segmented
 * sub-navigation inside a screen.
 */
export function TabButton({
  label,
  icon,
  activeIcon,
  active = false,
  badgeCount = 0,
  onPress,
}: TabButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        alignItems: 'center',
        rowGap: theme.spacing.xxs,
        paddingVertical: theme.spacing.xs,
        flex: 1,
      }}
    >
      <View>
        <Icon
          name={active ? (activeIcon ?? icon) : icon}
          size="iconMd"
          color={active ? 'tabBarActive' : 'tabBarInactive'}
        />
        {badgeCount > 0 ? (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -8,
              minWidth: 16,
              height: 16,
              paddingHorizontal: 3,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.danger,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="overline" style={{ color: theme.colors.textInverse, fontSize: 9 }}>
              {badgeCount > 99 ? '99+' : badgeCount}
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        variant="overline"
        numberOfLines={1}
        style={{ color: active ? theme.colors.tabBarActive : theme.colors.tabBarInactive }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
