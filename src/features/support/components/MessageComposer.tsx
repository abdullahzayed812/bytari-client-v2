import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { Input } from '@/components/forms';
import { Caption } from '@/components/typography';
import { useTheme } from '@/theme';

export interface MessageComposerProps {
  /** Disabled + a reason line when the thread is not writable for this caller. */
  disabledReason?: string | null;
  sending: boolean;
  /** Set when the last send failed (mapped, never raw). */
  error?: string | null;
  onSend: (body: string) => void;
}

/**
 * A single-line-growing message input + send button. Cleared on a successful
 * send (the parent flips `sending` false and the value is reset here on submit).
 * Disabled entirely — not just hidden — when the backend would reject a post
 * (CLOSED thread / blocked sender, §26).
 */
export function MessageComposer({ disabledReason, sending, error, onSend }: MessageComposerProps) {
  const theme = useTheme();
  const { t } = useTranslation('support');
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
