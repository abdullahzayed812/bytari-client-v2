import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Modal } from '@/components/overlays';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

export interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Blocking confirm/cancel dialog for irreversible or important actions. */
export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  loading,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const theme = useTheme();
  return (
    <Modal visible={visible} onClose={onCancel} title={title} dismissable={!loading}>
      {message ? (
        <Text variant="body" color="textSecondary">
          {message}
        </Text>
      ) : null}
      <View
        style={{ flexDirection: 'row', columnGap: theme.spacing.md, marginTop: theme.spacing.sm }}
      >
        <Button
          label={cancelLabel}
          variant="ghost"
          onPress={onCancel}
          disabled={loading}
          fullWidth
        />
        <Button
          label={confirmLabel}
          variant={destructive ? 'danger' : 'primary'}
          onPress={onConfirm}
          loading={loading}
          fullWidth
        />
      </View>
    </Modal>
  );
}
