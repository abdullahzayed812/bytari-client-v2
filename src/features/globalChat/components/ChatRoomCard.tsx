import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import type { ChatRoomSummary } from '../types';

export interface ChatRoomCardProps {
  room: ChatRoomSummary;
  onPress: () => void;
}

const IMAGE_SIZE = 56;

/** One row in the Global Chat rooms list — image, name, description, member count, join pill, unread badge. */
export function ChatRoomCard({ room, onPress }: ChatRoomCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('globalChat');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={room.name}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.md,
          padding: theme.spacing.md,
          borderRadius: theme.radius.xl,
          backgroundColor: room.unreadCount > 0 ? theme.colors.primarySoft : theme.colors.surface,
          borderWidth: 1,
          borderColor: room.unreadCount > 0 ? theme.colors.primary : theme.colors.border,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View
        style={{
          width: IMAGE_SIZE,
          height: IMAGE_SIZE,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {room.logoUrl ? (
          <Image
            source={room.logoUrl}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Icon name="chatbubbles-outline" size="iconLg" color="primary" />
        )}
      </View>

      <View style={{ flex: 1, rowGap: 4 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {room.name}
        </Text>
        {room.description ? (
          <Caption numberOfLines={1}>{room.description}</Caption>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
          <Icon name="people-outline" size="iconXs" color="textMuted" />
          <Caption>{t('room.memberCount', { count: room.memberCount })}</Caption>
        </View>
      </View>

      <View style={{ alignItems: 'flex-end', rowGap: 6 }}>
        {room.unreadCount > 0 ? (
          <Badge label={room.unreadCount > 99 ? '99+' : String(room.unreadCount)} tone="danger" size="sm" />
        ) : null}
        <Badge
          label={t(room.isJoined ? 'room.joined' : 'room.join')}
          tone={room.isJoined ? 'success' : 'neutral'}
          size="sm"
        />
      </View>
    </Pressable>
  );
}
