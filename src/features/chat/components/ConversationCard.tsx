import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Icon } from '@/components/content';
import { Caption } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { conversationIcon } from '../constants';
import type { Conversation } from '../types';

import { ConversationTitle } from './ConversationTitle';

export interface ConversationCardProps {
  conversation: Conversation;
  onPress?: () => void;
}

/** One row in the conversation list — title, last-activity, unread badge. */
export function ConversationCard({ conversation: c, onPress }: ConversationCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('chat');
  const unread = c.unreadCount ?? 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(unread > 0 ? 'list.a11yUnread' : 'list.a11yItem', { count: unread })}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.lg,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          borderColor: unread > 0 ? theme.colors.primary : theme.colors.border,
          backgroundColor: unread > 0 ? theme.colors.primarySoft : theme.colors.surface,
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
        <Icon name={conversationIcon(c.type)} size="iconMd" color="primary" />
      </View>

      <View style={{ flex: 1, rowGap: 2 }}>
        <ConversationTitle conversation={c} variant="bodyStrong" numberOfLines={1} />
        <Caption numberOfLines={1}>
          {c.lastMessageAt
            ? t('list.lastActivity', { date: formatDate(c.lastMessageAt) })
            : t('list.noMessages')}
        </Caption>
      </View>

      {unread > 0 ? (
        <Badge label={unread > 99 ? '99+' : String(unread)} tone="danger" size="sm" />
      ) : (
        <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
      )}
    </Pressable>
  );
}
