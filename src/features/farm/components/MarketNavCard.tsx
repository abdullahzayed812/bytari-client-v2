import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

interface Props {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}

/** Generic navigation card for the Poultry Farms landing screen's market/bourse/statistics entries. */
export function MarketNavCard({ icon, title, subtitle, onPress }: Props) {
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
          columnGap: theme.spacing.lg,
          padding: theme.spacing.lg,
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
          width: 44,
          height: 44,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size="iconMd" color="primary" />
      </View>
      <View style={{ flex: 1, rowGap: 2 }}>
        <Text variant="bodyStrong">{title}</Text>
        <Caption numberOfLines={1}>{subtitle}</Caption>
      </View>
      <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
    </Pressable>
  );
}
