import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Input } from '@/components/forms';
import { Modal } from '@/components/overlays';
import { devDataEnabled } from '@/lib/env';
import { useTheme } from '@/theme';

export interface ReasonPromptDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  label: string;
  placeholder?: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Backend requires 3–1000 chars for reject reasons; optional (0–500) for status changes. */
  required?: boolean;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

/** A blocking dialog that collects a free-text reason before a decision. */
export function ReasonPromptDialog({
  visible,
  title,
  message,
  label,
  placeholder,
  confirmLabel,
  cancelLabel,
  required,
  destructive,
  loading,
  onConfirm,
  onCancel,
}: ReasonPromptDialogProps) {
  const theme = useTheme();
  const [reason, setReason] = useState('');

  // DEV-ONLY: pre-filled so the dialog doesn't need retyping on every test
  // run. `__DEV__` is statically replaced with `false` in release builds.
  useEffect(() => {
    if (visible) setReason(devDataEnabled ? 'سبب تجريبي لأغراض الاختبار خلال مرحلة التطوير' : '');
  }, [visible]);

  const trimmed = reason.trim();
  const invalid = required ? trimmed.length < 3 || trimmed.length > 1000 : trimmed.length > 500;

  return (
    <Modal visible={visible} onClose={onCancel} title={title} dismissable={!loading}>
      <View style={{ rowGap: theme.spacing.md }}>
        <Input
          label={label}
          hint={message}
          placeholder={placeholder}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={3}
          required={required}
          autoFocus
        />
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button
              label={cancelLabel}
              variant="ghost"
              fullWidth
              onPress={onCancel}
              disabled={loading}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              fullWidth
              onPress={() => onConfirm(trimmed)}
              loading={loading}
              disabled={loading || invalid}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
