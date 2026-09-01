import { View } from 'react-native';

import { Badge, Card, Icon, type BadgeTone, type IconName } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

export interface HubTileProps {
  icon: IconName;
  label: string;
  hint?: string;
  badge?: { label: string; tone?: BadgeTone };
  onPress: () => void;
}

/** A single navigable row in a hub screen (Services / More). RTL-safe. */
export function HubTile({ icon, label, hint, badge, onPress }: HubTileProps) {
  const theme = useTheme();
  return (
    <Card variant="outlined" padding="md" onPress={onPress} accessibilityLabel={label}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surfaceAccent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size="iconMd" color="primary" />
        </View>
        <View style={{ flex: 1, rowGap: 2 }}>
          <Text variant="bodyMedium">{label}</Text>
          {hint ? <Caption>{hint}</Caption> : null}
        </View>
        {badge ? <Badge label={badge.label} tone={badge.tone ?? 'neutral'} size="sm" /> : null}
        <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
      </View>
    </Card>
  );
}
