import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import type { ChatMessage } from '../types';

export interface MessageBubbleProps {
  message: ChatMessage;
  /** The signed-in user's id — their own messages align to the end. */
  currentUserId: string | null;
  /** Long-press a own, non-deleted message to delete it. */
  onDelete?: (messageId: string) => void;
}

/**
 * One chat message. The caller's own messages align end; the counterpart's
 * align start; a `SYSTEM` message is centred and muted. A soft-deleted message
 * shows a placeholder, never the original body. Bodies render as plain RN
 * `<Text>` — no markup execution (§35 / privacy).
 */
export function MessageBubble({ message, currentUserId, onDelete }: MessageBubbleProps) {
  const theme = useTheme();
  const { t } = useTranslation('chat');
  const mine = message.senderUserId === currentUserId;
  const deleted = message.deletedAt !== null;

  if (message.type === 'SYSTEM') {
    return (
      <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xs }}>
        <Caption style={{ textAlign: 'center' }}>
          {message.body ?? t('message.deleted')} · {formatDate(message.createdAt)}
        </Caption>
      </View>
    );
  }

  return (
    <Pressable
      onLongPress={mine && !deleted && onDelete ? () => onDelete(message.id) : undefined}
      accessibilityRole="text"
      accessibilityLabel={
        deleted
          ? t('message.deleted')
          : t(mine ? 'message.a11yMine' : 'message.a11yTheirs', { body: message.body ?? '' })
      }
      style={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '82%',
        rowGap: 2,
      }}
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
          {deleted ? t('message.deleted') : message.body}
        </Text>
      </View>
      <Caption style={{ alignSelf: mine ? 'flex-end' : 'flex-start' }}>
        {formatDate(message.createdAt)}
      </Caption>
    </Pressable>
  );
}
