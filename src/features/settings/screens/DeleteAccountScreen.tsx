import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Card } from '@/components/content';
import { Alert, ConfirmationDialog, useToast } from '@/components/feedback';
import { PasswordInput } from '@/components/forms';
import { ScrollScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useDeleteAccountMutation } from '@/features/auth';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError, ApiErrorCode } from '@/services/api';
import { useTheme } from '@/theme';

/**
 * Route `/(app)/settings/delete-account` — "حذف الحساب" (Google Play account
 * deletion requirement). `DELETE /users/me` re-checks the password and runs
 * the same deletion engine as the admin delete; on success the local session
 * is cleared and the auth redirector lands on the welcome screen.
 * Organization owners / admin accounts get an explanation instead.
 */
export default function DeleteAccountScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { t } = useTranslation('settings');
  const del = useDeleteAccountMutation();

  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const run = (): void => {
    setConfirm(false);
    del.mutate(password, {
      onSuccess: () => {
        setPassword('');
        toast.show({ tone: 'success', message: t('deleteAccount.success') });
      },
      onError: (error) => {
        if (error instanceof ApiError && error.code === ApiErrorCode.INVALID_CURRENT_PASSWORD) {
          setPasswordError(t('deleteAccount.wrongPassword'));
        } else if (error instanceof ApiError && error.code === ApiErrorCode.USER_DELETE_BLOCKED) {
          const rule = error.details?.[0]?.rule;
          setBlockedReason(
            rule === 'ADMIN_ACCOUNT'
              ? t('deleteAccount.adminAccount')
              : t('deleteAccount.ownsOrganizations'),
          );
        } else {
          toast.show({ tone: 'danger', message: apiErrorMessage(error) });
        }
      },
    });
  };

  return (
    <ScrollScreen padded={false}>
      <AppHeader title={t('deleteAccount.title')} showBack />
      <View
        style={{
          paddingHorizontal: theme.screenPadding,
          paddingTop: theme.spacing.md,
          rowGap: theme.spacing.lg,
          width: '100%',
          maxWidth: 560,
          alignSelf: 'center',
        }}
      >
        <Alert tone="danger" message={t('deleteAccount.intro')} />
        <Card padding="lg" variant="outlined">
          <View style={{ rowGap: theme.spacing.xs }}>
            <Text variant="bodyMedium">{t('deleteAccount.deletedTitle')}</Text>
            <Caption color="textSecondary">{t('deleteAccount.deletedBody')}</Caption>
          </View>
        </Card>
        <Card padding="lg" variant="outlined">
          <View style={{ rowGap: theme.spacing.xs }}>
            <Text variant="bodyMedium">{t('deleteAccount.keptTitle')}</Text>
            <Caption color="textSecondary">{t('deleteAccount.keptBody')}</Caption>
          </View>
        </Card>

        {blockedReason ? (
          <View style={{ rowGap: theme.spacing.sm }}>
            <Alert tone="warning" message={blockedReason} />
            <Button
              label={t('deleteAccount.contactSupport')}
              variant="secondary"
              leftIcon="chatbubbles-outline"
              fullWidth
              onPress={() => router.push(Routes.contact)}
            />
          </View>
        ) : null}

        <Card padding="lg">
          <PasswordInput
            label={t('deleteAccount.passwordLabel')}
            hint={passwordError ? undefined : t('deleteAccount.passwordHint')}
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (passwordError) setPasswordError(undefined);
            }}
            error={passwordError}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="done"
          />
        </Card>
        <Button
          label={t('deleteAccount.submit')}
          variant="danger"
          leftIcon="trash-outline"
          fullWidth
          loading={del.isPending}
          disabled={del.isPending || password.length === 0}
          onPress={() => setConfirm(true)}
        />
      </View>

      <ConfirmationDialog
        visible={confirm}
        title={t('deleteAccount.confirmTitle')}
        message={t('deleteAccount.confirmBody')}
        confirmLabel={t('deleteAccount.confirm')}
        cancelLabel={t('cancel')}
        destructive
        loading={del.isPending}
        onConfirm={run}
        onCancel={() => setConfirm(false)}
      />
    </ScrollScreen>
  );
}
