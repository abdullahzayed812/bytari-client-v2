import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Icon } from '@/components/content';
import { ImageThumbnailRow, ImageViewer } from '@/components/media';
import { Caption, Text } from '@/components/typography';
import { UserName } from '@/features/users/components';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { MESSAGE_SOURCE_META } from '../constants';
import type { ThreadMessage } from '../types';

export interface MessageBubbleProps {
  message: ThreadMessage;
  /** The signed-in user's id — a `USER` message from them is right-aligned. */
  currentUserId: string | null;
}

/**
 * One message. `USER` messages from the current user align to the end; everyone
 * else (SUPERVISOR / ADMIN / AI) aligns to the start with a small role label;
 * SYSTEM is centred and muted. A soft-deleted message shows a placeholder.
 * Bodies are rendered as PLAIN TEXT (RN `<Text>` never executes markup — §35).
 * Attachments (CONSULTATION / INQUIRY first message) render as thumbnails that
 * open the shared full-screen `ImageViewer`; a soft-deleted message hides them.
 */
export function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const theme = useTheme();
  const { t } = useTranslation('support');
  const meta = MESSAGE_SOURCE_META[message.source];
  const mine = message.source === 'USER' && message.senderUserId === currentUserId;
  const align: 'start' | 'end' | 'center' = mine ? 'end' : meta.align;
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const images = message.deletedAt ? [] : (message.imageUrls ?? []);

  if (message.source === 'SYSTEM' || align === 'center') {
    return (
      <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xs }}>
        <Caption style={{ textAlign: 'center' }}>
          {message.body ?? t('message.deleted')} · {formatDate(message.createdAt)}
        </Caption>
      </View>
    );
  }

  return (
    <View
      style={{
        alignSelf: align === 'end' ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        rowGap: 2,
      }}
    >
      {!mine ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
          <Icon name={meta.icon} size="iconXs" color="textSecondary" />
          {message.source === 'USER' ? (
            <UserName userId={message.senderUserId} variant="caption" color="textSecondary" />
          ) : (
            <Caption>{t(`message.source.${message.source}`)}</Caption>
          )}
        </View>
      ) : null}

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
          style={message.deletedAt ? { color: theme.colors.textMuted } : undefined}
        >
          {message.deletedAt ? t('message.deleted') : message.body}
        </Text>

        {images.length > 0 ? (
          <View style={{ marginTop: theme.spacing.sm }}>
            <ImageThumbnailRow
              images={images}
              size={72}
              onPress={setViewerIndex}
              accessibilityLabelFor={(index, total) =>
                t('message.attachmentA11y', { index: index + 1, total })
              }
            />
          </View>
        ) : null}
      </View>

      <Caption style={{ alignSelf: align === 'end' ? 'flex-end' : 'flex-start' }}>
        {formatDate(message.createdAt)}
      </Caption>

      <ImageViewer
        visible={viewerIndex !== null}
        images={images}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
      />
    </View>
  );
}
