import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { localizedNotificationText, notificationMeta } from '../constants';
import type { AppNotification } from '../types';

function broadcastImageUrl(n: AppNotification): string | null {
  if (n.type !== 'ORGANIZATION_BROADCAST') return null;
  const url = n.data?.imageUrl;
  return typeof url === 'string' ? url : null;
}

export interface NotificationCardProps {
  notification: AppNotification;
  onPress?: () => void;
}

/**
 * One notification row. Unread is conveyed three ways — a leading dot, a bold
 * title and a tinted surface — never colour alone (§25/§42). Title / body are
 * backend-rendered plain text (RN `<Text>` executes no markup).
 */
export function NotificationCard({ notification: n, onPress }: NotificationCardProps) {
  const theme = useTheme();
  const { t, i18n } = useTranslation('notifications');
  const meta = notificationMeta(n.type);
  const unread = !n.read;
  const imageUrl = broadcastImageUrl(n);
  const { title, body } = localizedNotificationText(n, t, i18n.language);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(unread ? 'card.a11yUnread' : 'card.a11yRead', { title })}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          columnGap: theme.spacing.md,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          borderColor: unread ? theme.colors.primary : theme.colors.border,
          backgroundColor: unread ? theme.colors.primarySoft : theme.colors.surface,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <Icon name={meta.icon} size="iconMd" color="primary" />
        )}
      </View>

      <View style={{ flex: 1, rowGap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
          {unread ? (
            <View
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.colors.primary,
              }}
            />
          ) : null}
          <Text
            variant="bodyMedium"
            weight={unread ? 'bold' : 'regular'}
            style={{ flex: 1 }}
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>
        {body ? (
          <Text variant="body" color="textSecondary" numberOfLines={3}>
            {body}
          </Text>
        ) : null}
        <Caption>{formatDate(n.createdAt, i18n.language)}</Caption>
      </View>

      <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
    </Pressable>
  );
}
