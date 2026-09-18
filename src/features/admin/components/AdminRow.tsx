import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Badge, Card, Icon, type BadgeTone, type IconName } from '@/components/content';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

export interface AdminRowProps {
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: { label: string; tone?: BadgeTone };
  /**
   * Optional leading thumbnail. `onPress` (if given) is called instead of the
   * row's own `onPress` when the thumbnail itself is tapped — e.g. to open a
   * full-screen `ImageViewer` rather than navigating to the detail screen.
   */
  image?: { uri: string | null; fallbackIcon?: IconName; onPress?: () => void };
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
  image,
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
        {image ? (
          <Pressable
            accessibilityRole={image.onPress ? 'imagebutton' : undefined}
            accessibilityLabel={image.onPress ? title : undefined}
            disabled={!image.onPress}
            onPress={image.onPress}
            style={{
              width: 44,
              height: 44,
              borderRadius: theme.radius.md,
              overflow: 'hidden',
              backgroundColor: theme.colors.surfaceAccent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {image.uri ? (
              <Image source={{ uri: image.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <Icon name={image.fallbackIcon ?? 'image-outline'} size="iconSm" color="textMuted" />
            )}
          </Pressable>
        ) : null}
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
