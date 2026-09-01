import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Badge, Card, Icon, type BadgeTone } from '@/components/content';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

export interface AdminRowProps {
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: { label: string; tone?: BadgeTone };
  /** Trailing action buttons (rendered below the row when present). */
  actions?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}

/** One entity row in an admin list — title, subtitle, status badge, optional inline actions. */
export function AdminRow({
  title,
  subtitle,
  meta,
  badge,
  actions,
  onPress,
  accessibilityLabel,
}: AdminRowProps) {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      padding="md"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
        <View style={{ flex: 1, rowGap: 2 }}>
          <Text variant="bodyMedium" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" color="textSecondary" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          {meta ? (
            <Text variant="overline" color="textMuted" numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
        </View>
        {badge ? <Badge label={badge.label} tone={badge.tone ?? 'neutral'} size="sm" /> : null}
        {onPress ? (
          <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
        ) : null}
      </View>
      {actions ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.spacing.sm,
            marginTop: theme.spacing.md,
          }}
        >
          {actions}
        </View>
      ) : null}
    </Card>
  );
}
