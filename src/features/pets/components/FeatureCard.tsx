import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/colors';

export interface FeatureCardProps {
  title: string;
  subtitle: string;
  /** Decorative line icon shown at the card's end edge. */
  icon: IconName;
  /** Soft tinted card background token. */
  surface: keyof ColorTokens;
  /** Saturated token for the title and the circular action pip. */
  accent: keyof ColorTokens;
  onPress: () => void;
  accessibilityLabel: string;
  /** Optional white pill (e.g. "مفقود" on the lost-animals card). */
  badgeLabel?: string;
}

/**
 * Discovery entry card for the Pets landing 2×2 grid — a coloured surface with
 * a title, a short blurb, a circular forward pip, and a large watermark icon.
 * Purely presentational; colours come from `theme.colors.feature*` tokens.
 */
export function FeatureCard({
  title,
  subtitle,
  icon,
  surface,
  accent,
  onPress,
  accessibilityLabel,
  badgeLabel,
}: FeatureCardProps) {
  const theme = useTheme();
  const accentColor = theme.colors[accent];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flex: 1,
          minHeight: 150,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors[surface],
          padding: theme.spacing.lg,
          overflow: 'hidden',
          justifyContent: 'space-between',
          rowGap: theme.spacing.md,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View
        style={{
          position: 'absolute',
          bottom: -theme.spacing.md,
          end: -theme.spacing.md,
          opacity: 0.18,
        }}
      >
        <Icon name={icon} size={104} color={accent} />
      </View>

      <View style={{ rowGap: theme.spacing.xs }}>
        <Text variant="bodyStrong" style={{ color: accentColor }} numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={3}>
          {subtitle}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: theme.radius.pill,
            backgroundColor: accentColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="chevron-forward" size="iconXs" color="onPrimary" directional />
        </View>
        {badgeLabel ? (
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.sm,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: 2,
            }}
          >
            <Text variant="overline" style={{ color: accentColor }} weight="bold">
              {badgeLabel}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
