import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Icon } from '@/components/content';
import { Alert, useToast } from '@/components/feedback';
import { Input } from '@/components/forms';
import { Caption } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import {
  isPermissionError,
  pickImage,
  useMediaUpload,
  type PresignProvider,
} from '@/services/media';
import { useTheme } from '@/theme';

export interface MessageComposerProps {
  /** Disabled + a reason line when the thread is not writable for this caller. */
  disabledReason?: string | null;
  sending: boolean;
  /** Set when the last send failed (mapped, never raw). */
  error?: string | null;
  onSend: (body: string, imageKeys?: string[]) => void;
  /** Enables "attach image" (thread message photos, validated again by the server). */
  attachmentProvider?: PresignProvider;
}

/**
 * A single-line-growing message input + send button, with an optional photo
 * attachment (uploaded straight to storage first; only its key is sent).
 * Cleared on a successful send. Disabled entirely — not just hidden — when
 * the backend would reject a post (CLOSED thread / blocked sender, §26).
 */
export function MessageComposer({
  disabledReason,
  sending,
  error,
  onSend,
  attachmentProvider,
}: MessageComposerProps) {
  const theme = useTheme();
  const { t } = useTranslation('support');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const [value, setValue] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const upload = useMediaUpload(
    attachmentProvider ?? { requestUpload: () => Promise.reject(new Error('no provider')) },
  );
  const disabled = Boolean(disabledReason);
  const uploading = upload.status === 'uploading';
  const imageKey = upload.status === 'success' ? (upload.result?.storageKey ?? null) : null;
  // Text, an attached image, or both — an image-only message is allowed.
  const canSend =
    !disabled && !sending && !uploading && (value.trim().length > 0 || imageKey !== null);

  const clearImage = (): void => {
    upload.reset();
    setPreview(null);
  };

  const attach = async (): Promise<void> => {
    try {
      const file = await pickImage({ source: 'library' });
      if (!file) return;
      setPreview(file.uri);
      const result = await upload.upload(file);
      if (!result) setPreview(null);
    } catch (e) {
      setPreview(null);
      toast.show({
        tone: 'danger',
        message: isPermissionError(e) ? tc('media.permissionBody') : apiErrorMessage(e),
      });
    }
  };

  const submit = (): void => {
    const body = value.trim();
    if (!canSend) return;
    onSend(body, imageKey ? [imageKey] : undefined);
    setValue('');
    clearImage();
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
      {preview ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
          <Image
            source={{ uri: preview }}
            style={{
              width: 56,
              height: 56,
              borderRadius: theme.radius.md,
              opacity: uploading ? 0.5 : 1,
            }}
            contentFit="cover"
          />
          <Caption style={{ flex: 1 }}>
            {uploading
              ? tc('media.uploading')
              : upload.status === 'error'
                ? tc('media.uploadFailed')
                : ''}
          </Caption>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tc('media.remove')}
            onPress={clearImage}
          >
            <Icon name="close-circle" size="iconMd" color="danger" />
          </Pressable>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', columnGap: theme.spacing.sm }}>
        {attachmentProvider ? (
          <IconButton
            icon="image-outline"
            variant="soft"
            accessibilityLabel={tc('media.addImage')}
            disabled={disabled || sending || uploading}
            onPress={() => void attach()}
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
            maxLength={4000}
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
    </View>
  );
}
