import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Icon, type IconName } from '@/components/content';
import { Alert, useToast } from '@/components/feedback';
import { Input } from '@/components/forms';
import { BottomSheet } from '@/components/overlays';
import { Caption, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import {
  isPermissionError,
  pickDocument,
  pickImage,
  pickVideo,
  type LocalFile,
} from '@/services/media';
import { useTheme } from '@/theme';

import { useChatAttachmentUpload, withFileSize } from '../hooks/useChatAttachment';
import {
  attachmentKindFor,
  CHAT_ATTACHMENT_MAX_BYTES,
  CHAT_FILE_MIME_TYPES,
  MESSAGE_BODY_MAX,
  type OutgoingAttachment,
} from '../types';

export interface MessageComposerProps {
  /** Disabled + a reason line when messaging is not possible (org inactive, etc.). */
  disabledReason?: string | null;
  sending: boolean;
  error?: string | null;
  /**
   * Enables the attachment action (image / video / file) for this conversation.
   * Omit for a text-only composer.
   */
  conversationId?: string;
  onSend: (body: string, attachment?: OutgoingAttachment) => void;
}

type PickKind = 'photo' | 'camera' | 'video' | 'file';

/**
 * Chat message composer. With `conversationId` it offers an attachment:
 * pick (the shared image editor runs for photos) → preview → immediate upload
 * with progress → cancel / retry → send together with the (optional) text.
 * Cleared on submit; disabled entirely (not just hidden) when `disabledReason`
 * is set.
 */
export function MessageComposer({
  disabledReason,
  sending,
  error,
  conversationId,
  onSend,
}: MessageComposerProps) {
  const theme = useTheme();
  const { t } = useTranslation('chat');
  const toast = useToast();
  const [value, setValue] = useState('');
  const [sheet, setSheet] = useState(false);
  const up = useChatAttachmentUpload(conversationId ?? '');
  const disabled = Boolean(disabledReason);
  const pending = up.file;
  const uploaded = up.status === 'success' && up.result && pending ? up.result : null;
  const canSend =
    !disabled &&
    !sending &&
    up.status !== 'uploading' &&
    up.status !== 'error' &&
    (value.trim().length > 0 || Boolean(uploaded));

  const start = async (kind: PickKind) => {
    setSheet(false);
    try {
      let file: LocalFile | null = null;
      if (kind === 'photo' || kind === 'camera') {
        file = await pickImage({ source: kind === 'camera' ? 'camera' : 'library' });
      } else if (kind === 'video') {
        file = await pickVideo();
      } else {
        file = (await pickDocument({ types: CHAT_FILE_MIME_TYPES }))[0] ?? null;
      }
      if (!file) return;
      const sized = await withFileSize(file);
      const limit = CHAT_ATTACHMENT_MAX_BYTES[attachmentKindFor(sized.mimeType)];
      if (sized.size && sized.size > limit) {
        toast.show({
          tone: 'warning',
          message: t('message.attachTooLarge', { mb: Math.round(limit / 1024 / 1024) }),
        });
        return;
      }
      await up.upload(sized);
    } catch (e) {
      toast.show({
        tone: isPermissionError(e) ? 'warning' : 'danger',
        message: isPermissionError(e) ? t('message.attachPermission') : apiErrorMessage(e),
      });
    }
  };

  const submit = (): void => {
    const body = value.trim();
    if (!canSend) return;
    const attachment: OutgoingAttachment | undefined =
      uploaded && pending
        ? {
            kind: attachmentKindFor(pending.mimeType),
            storageKey: uploaded.storageKey,
            fileName: pending.name,
          }
        : undefined;
    onSend(body, attachment);
    setValue('');
    up.reset();
  };

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        padding: theme.spacing.md,
        rowGap: theme.spacing.xs,
        backgroundColor: theme.colors.background,
      }}
    >
      {error ? <Alert tone="danger" message={error} /> : null}
      {disabledReason ? <Caption>{disabledReason}</Caption> : null}

      {pending ? (
        <PendingAttachment
          file={pending}
          status={up.status}
          progress={up.progress}
          onCancel={() => up.reset()}
          onRetry={() => void up.upload(pending)}
        />
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', columnGap: theme.spacing.sm }}>
        {conversationId ? (
          <IconButton
            icon="attach-outline"
            variant="soft"
            accessibilityLabel={t('message.attach')}
            disabled={disabled || sending || up.status === 'uploading'}
            onPress={() => setSheet(true)}
          />
        ) : null}
        <View style={{ flex: 1 }}>
          <Input
            value={value}
            onChangeText={setValue}
            placeholder={t('message.placeholder')}
            accessibilityLabel={t('message.placeholder')}
            editable={!disabled && !sending}
            multiline
            numberOfLines={3}
            maxLength={MESSAGE_BODY_MAX}
          />
        </View>
        <IconButton
          icon={sending ? 'hourglass-outline' : 'send'}
          variant="filled"
          accessibilityLabel={t('message.send')}
          disabled={!canSend}
          onPress={submit}
        />
      </View>

      {conversationId ? (
        <BottomSheet
          visible={sheet}
          onClose={() => setSheet(false)}
          title={t('message.attachTitle')}
        >
          <View style={{ rowGap: theme.spacing.xs, paddingBottom: theme.spacing.md }}>
            <SheetRow
              icon="images-outline"
              label={t('message.attachPhoto')}
              onPress={() => void start('photo')}
            />
            <SheetRow
              icon="camera-outline"
              label={t('message.attachCamera')}
              onPress={() => void start('camera')}
            />
            <SheetRow
              icon="videocam-outline"
              label={t('message.attachVideo')}
              onPress={() => void start('video')}
            />
            <SheetRow
              icon="document-outline"
              label={t('message.attachFile')}
              onPress={() => void start('file')}
            />
          </View>
        </BottomSheet>
      ) : null}
    </View>
  );
}

function PendingAttachment({
  file,
  status,
  progress,
  onCancel,
  onRetry,
}: {
  file: LocalFile;
  status: string;
  progress: number;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('chat');
  const kind = attachmentKindFor(file.mimeType);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: theme.spacing.sm,
        padding: theme.spacing.sm,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: status === 'error' ? theme.colors.danger : theme.colors.border,
        backgroundColor: theme.colors.surface,
      }}
    >
      {kind === 'IMAGE' ? (
        <Image
          source={{ uri: file.uri }}
          style={{ width: 48, height: 48, borderRadius: theme.radius.sm }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.surfaceAccent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            name={kind === 'VIDEO' ? 'videocam-outline' : 'document-outline'}
            size="iconMd"
            color="primary"
          />
        </View>
      )}
      <View style={{ flex: 1, rowGap: 2 }}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {file.name}
        </Text>
        {status === 'uploading' ? (
          <>
            <Caption>
              {t('message.attachUploading', { percent: Math.round(progress * 100) })}
            </Caption>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: theme.colors.border }}>
              <View
                style={{
                  width: `${Math.max(4, Math.round(progress * 100))}%`,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.colors.primary,
                }}
              />
            </View>
          </>
        ) : status === 'error' ? (
          <Caption color="danger">{t('message.attachFailed')}</Caption>
        ) : file.size ? (
          <Caption>{formatBytes(file.size)}</Caption>
        ) : null}
      </View>
      {status === 'error' ? (
        <IconButton
          icon="refresh-outline"
          size="sm"
          variant="plain"
          accessibilityLabel={t('message.attachRetry')}
          onPress={onRetry}
        />
      ) : null}
      <IconButton
        icon="close"
        size="sm"
        variant="plain"
        accessibilityLabel={t('message.attachCancel')}
        onPress={onCancel}
      />
    </View>
  );
}

function SheetRow({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.sm,
          borderRadius: theme.radius.md,
        },
        pressed && { backgroundColor: theme.colors.surfaceMuted },
      ]}
    >
      <Icon name={icon} size="iconMd" color="primary" />
      <Text variant="bodyMedium">{label}</Text>
    </Pressable>
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
