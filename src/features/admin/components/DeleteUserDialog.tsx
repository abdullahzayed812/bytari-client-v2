import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { Input } from '@/components/forms';
import { Modal } from '@/components/overlays';
import { Caption, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError, ApiErrorCode } from '@/services/api';
import { useTheme } from '@/theme';

export interface DeleteUserDialogProps {
  visible: boolean;
  /** Shown so the admin sees exactly which account is targeted. */
  name: string;
  email: string;
  loading: boolean;
  error?: unknown;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Localized reason for a 409 `USER_DELETE_BLOCKED` (the server message names the details). */
export function deleteBlockedReason(
  error: unknown,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string | null {
  if (!(error instanceof ApiError) || error.code !== ApiErrorCode.USER_DELETE_BLOCKED) return null;
  const rule = error.details?.[0]?.rule;
  const key =
    rule === 'OWNS_ORGANIZATIONS'
      ? 'users.delete.blocked.ownsOrganizations'
      : rule === 'ADMIN_ACCOUNT'
        ? 'users.delete.blocked.admin'
        : 'users.delete.blocked.protected';
  return t(key, { details: error.message });
}

/**
 * Permanent-deletion confirmation. The admin must type the account's e-mail
 * before the destructive button enables — one accidental tap can never delete.
 */
export function DeleteUserDialog({
  visible,
  name,
  email,
  loading,
  error,
  onConfirm,
  onCancel,
}: DeleteUserDialogProps) {
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const [typed, setTyped] = useState('');
  const matches = typed.trim().toLowerCase() === email.trim().toLowerCase();
  const close = () => {
    setTyped('');
    onCancel();
  };
  const errorText = error
    ? (deleteBlockedReason(error, t as never) ?? apiErrorMessage(error))
    : null;

  return (
    <Modal visible={visible} onClose={close} title={t('users.delete.title')} dismissable={!loading}>
      <View style={{ rowGap: theme.spacing.md }}>
        <View style={{ rowGap: 2 }}>
          <Text variant="bodyStrong">{name}</Text>
          <Caption selectable>{email}</Caption>
        </View>
        <Alert tone="danger" message={t('users.delete.warning')} />
        <Caption>{t('users.delete.explanation')}</Caption>
        <Input
          label={t('users.delete.confirmLabel')}
          placeholder={email}
          value={typed}
          onChangeText={setTyped}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          accessibilityLabel={t('users.delete.confirmLabel')}
        />
        {errorText ? <Alert tone="danger" message={errorText} /> : null}
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button
              label={t('common.cancel')}
              variant="outline"
              fullWidth
              disabled={loading}
              onPress={close}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t('users.delete.confirmCta')}
              variant="danger"
              fullWidth
              loading={loading}
              disabled={!matches || loading}
              onPress={onConfirm}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
