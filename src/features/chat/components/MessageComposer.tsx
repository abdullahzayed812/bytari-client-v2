import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { Input } from '@/components/forms';
import { Caption } from '@/components/typography';
import { useTheme } from '@/theme';

import { MESSAGE_BODY_MAX } from '../types';

export interface MessageComposerProps {
  /** Disabled + a reason line when messaging is not possible (org inactive, etc.). */
  disabledReason?: string | null;
  sending: boolean;
  error?: string | null;
  onSend: (body: string) => void;
}

/**
 * Text-only message composer. The backend has no message attachments, so there
 * is no attach affordance (documented). Cleared on submit; disabled entirely
 * (not just hidden) when `disabledReason` is set.
 */
export function MessageComposer({ disabledReason, sending, error, onSend }: MessageComposerProps) {
  const theme = useTheme();
  const { t } = useTranslation('chat');
  const [value, setValue] = useState('');
  const disabled = Boolean(disabledReason);
  const canSend = !disabled && !sending && value.trim().length > 0;

  const submit = (): void => {
    const body = value.trim();
    if (!body || disabled || sending) return;
    onSend(body);
    setValue('');
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
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', columnGap: theme.spacing.sm }}>
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
    </View>
  );
}
