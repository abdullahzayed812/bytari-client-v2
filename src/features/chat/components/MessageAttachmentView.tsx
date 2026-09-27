import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { useToast } from '@/components/feedback';
import { ImageViewer } from '@/components/media';
import { Caption, Text } from '@/components/typography';
import { openExternalUrl } from '@/features/content/openExternal';
import { useTheme } from '@/theme';

import { chatApi } from '../api';
import type { ChatMessage, ChatMessageAttachment } from '../types';

import { formatBytes } from './MessageComposer';

/**
 * A message's attachment inside a bubble. Images render inline (tap → full
 * screen); videos and files open in the OS player / viewer. URLs are
 * short-lived signed URLs — on expiry a fresh one is fetched from
 * `GET /conversations/:id/messages/:messageId/attachment` (access re-checked).
 */
export function MessageAttachmentView({
  message,
  attachment,
}: {
  message: ChatMessage;
  attachment: ChatMessageAttachment;
}) {
  const theme = useTheme();
  const { t } = useTranslation('chat');
  const toast = useToast();
  const [url, setUrl] = useState(attachment.url);
  const [viewer, setViewer] = useState(false);

  const refresh = async (): Promise<string | null> => {
    try {
      const fresh = await chatApi.getAttachment(message.conversationId, message.id);
      if (fresh) setUrl(fresh.url);
      return fresh?.url ?? null;
    } catch {
      return null;
    }
  };

  const open = async () => {
    const target = (await refresh()) ?? url;
    if (!(await openExternalUrl(target)))
      toast.show({ tone: 'danger', message: t('message.openFailed') });
  };

  if (attachment.kind === 'IMAGE') {
    return (
      <>
        <Pressable
          accessibilityRole="imagebutton"
          accessibilityLabel={t('message.attachmentImage')}
          onPress={() => setViewer(true)}
        >
          <Image
            source={{ uri: url }}
            style={{ width: 220, height: 220, borderRadius: theme.radius.md }}
            contentFit="cover"
            onError={() => void refresh()}
          />
        </Pressable>
        <ImageViewer visible={viewer} images={[url]} onClose={() => setViewer(false)} />
      </>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('message.openAttachment')}: ${attachment.fileName}`}
      onPress={() => void open()}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: theme.spacing.sm,
        padding: theme.spacing.sm,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceAccent,
        minWidth: 200,
      }}
    >
      <Icon
        name={attachment.kind === 'VIDEO' ? 'play-circle-outline' : 'document-text-outline'}
        size="iconLg"
        color="primary"
      />
      <View style={{ flex: 1, rowGap: 2 }}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {attachment.fileName}
        </Text>
        <Caption>
          {t(attachment.kind === 'VIDEO' ? 'message.attachmentVideo' : 'message.attachmentFile')} ·{' '}
          {formatBytes(attachment.sizeBytes)}
        </Caption>
      </View>
    </Pressable>
  );
}
