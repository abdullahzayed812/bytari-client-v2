import { View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { Label, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/colors';

export interface TipPointListProps {
  icon: IconName;
  title: string;
  points: string[];
  /** Accent for the icon + bullets. Default `primary`. */
  accent?: keyof ColorTokens;
}

/** A titled, bulleted section used on the tip detail screen. */
export function TipPointList({ icon, title, points, accent = 'primary' }: TipPointListProps) {
  const theme = useTheme();
  if (points.length === 0) return null;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        rowGap: theme.spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
        <Icon name={icon} size="iconSm" color={accent} />
        <Label style={{ color: theme.colors[accent] }}>{title}</Label>
      </View>
      <View style={{ rowGap: theme.spacing.xs }}>
        {points.map((point, i) => (
          <View key={i} style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: theme.radius.pill,
                backgroundColor: theme.colors[accent],
                marginTop: 8,
              }}
            />
            <Text variant="body" style={{ flex: 1 }}>
              {point}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
