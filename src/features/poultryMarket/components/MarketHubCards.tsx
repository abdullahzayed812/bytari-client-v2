import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { rawPalette, useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/colors';

interface TileProps {
  icon: IconName;
  iconColor: keyof ColorTokens;
  iconSurface: keyof ColorTokens;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function ArrowPip({ size = 24 }: { size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.surfaceAccent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name="chevron-back" directional size="iconXs" color="primary" />
    </View>
  );
}

/** One square tile of the 2×2 markets / bourses grid. */
export function MarketFeatureTile({
  icon,
  iconColor,
  iconSurface,
  title,
  subtitle,
  onPress,
}: TileProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flex: 1,
          alignItems: 'center',
          padding: theme.spacing.md,
          rowGap: theme.spacing.xs,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.xs,
        },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors[iconSurface],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size="iconMd" color={iconColor} />
      </View>
      <Text variant="bodyStrong" center numberOfLines={1}>
        {title}
      </Text>
      <Caption center numberOfLines={2} style={{ flex: 1 }}>
        {subtitle}
      </Caption>
      <View style={{ alignSelf: 'stretch', alignItems: 'flex-end' }}>
        <ArrowPip />
      </View>
    </Pressable>
  );
}

/** The wide "إحصائية الدواجن" row under the grid. */
export function MarketWideCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.md,
          padding: theme.spacing.md,
          minHeight: 84,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.xs,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View
        style={{
          width: 56,
          height: 48,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size="iconLg" color="primary" />
      </View>
      <View style={{ flex: 1, rowGap: 2 }}>
        <Text variant="subtitle" weight="bold">
          {title}
        </Text>
        <Caption>{subtitle}</Caption>
      </View>
      <ArrowPip size={32} />
    </Pressable>
  );
}

/**
 * The compact poultry-farm card shown right under the ad: the user's eligible
 * farm(s) (`variant="farm"`), or "إضافة حقل دواجن" for a merchant-only account.
 */
export function MarketFarmEntryCard({
  variant,
  title,
  subtitle,
  onPress,
}: {
  variant: 'farm' | 'add';
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      testID={variant === 'farm' ? 'market-farm-entry' : 'market-add-farm-entry'}
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [{ borderRadius: theme.radius.xl }, pressed && { opacity: 0.9 }]}
    >
      <LinearGradient
        colors={[rawPalette.green700, rawPalette.green900]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: theme.radius.xl,
          padding: theme.spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.md,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radius.lg,
            backgroundColor: rawPalette.green100,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={variant === 'farm' ? 'home' : 'add'} size="iconMd" color="primary" />
        </View>
        <View style={{ flex: 1, rowGap: 2 }}>
          <Text variant="bodyStrong" style={{ color: rawPalette.white }} numberOfLines={1}>
            {title}
          </Text>
          <Text variant="caption" style={{ color: 'rgba(255,255,255,0.9)' }} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: theme.radius.pill,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="chevron-back" directional size="iconXs" color="textInverse" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}
