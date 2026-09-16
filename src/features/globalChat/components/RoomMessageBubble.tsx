import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Caption, Text } from '@/components/typography';
import type { ChatMessage } from '@/features/chat/types';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

export interface RoomMessageBubbleProps {
  message: ChatMessage;
  currentUserId: string | null;
  /** Resolved via `useChatRoomMembers` — `undefined` while the roster is still loading. */
  senderName: string | undefined;
  /** Long-press a own, non-deleted message to delete it. */
  onDelete?: (messageId: string) => void;
  /** Moderator "…" menu (report / moderator-delete) for someone else's message. */
  onOpenMenu?: (messageId: string) => void;
}

/**
 * Room variant of `@/features/chat`'s `MessageBubble` — same visual shell,
 * plus a sender-name line above another member's bubble (a room needs to show
 * WHO said what, unlike a 1:1 thread) and a "…" affordance opening the
 * report/moderation menu.
 */
export function RoomMessageBubble({
  message,
  currentUserId,
  senderName,
  onDelete,
  onOpenMenu,
}: RoomMessageBubbleProps) {
  const theme = useTheme();
  const { t } = useTranslation('globalChat');
  const mine = message.senderUserId === currentUserId;
  const deleted = message.deletedAt !== null;

  if (message.type === 'SYSTEM') {
    return (
      <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xs }}>
        <Caption style={{ textAlign: 'center' }}>
          {message.body ?? t('thread.messageDeleted')} · {formatDate(message.createdAt)}
        </Caption>
      </View>
    );
  }

  return (
    <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '82%', rowGap: 2 }}>
      {!mine && senderName ? (
        <Caption style={{ marginStart: theme.spacing.sm }} color="primary">
          {senderName}
        </Caption>
      ) : null}
      <Pressable
        onLongPress={mine && !deleted && onDelete ? () => onDelete(message.id) : undefined}
        accessibilityRole="text"
        accessibilityLabel={deleted ? t('thread.messageDeleted') : message.body ?? ''}
        style={{ flexDirection: 'row', alignItems: 'flex-end', columnGap: 4 }}
      >
        <View
          style={{
            padding: theme.spacing.md,
            borderRadius: theme.radius.lg,
            backgroundColor: mine ? theme.colors.primarySoft : theme.colors.surface,
            borderWidth: 1,
            borderColor: mine ? theme.colors.primary : theme.colors.border,
          }}
        >
          <Text
            variant="body"
            style={deleted ? { color: theme.colors.textMuted, fontStyle: 'italic' } : undefined}
          >
            {deleted ? t('thread.messageDeleted') : message.body}
          </Text>
        </View>
        {!mine && !deleted && onOpenMenu ? (
          <IconButton
            icon="ellipsis-vertical"
            variant="plain"
            size="sm"
            accessibilityLabel={t('thread.messageMenuA11y')}
            onPress={() => onOpenMenu(message.id)}
          />
        ) : null}
      </Pressable>
      <Caption style={{ alignSelf: mine ? 'flex-end' : 'flex-start' }}>
        {formatDate(message.createdAt)}
      </Caption>
    </View>
  );
}
