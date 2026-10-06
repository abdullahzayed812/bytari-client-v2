import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Card } from '@/components/content';
import { useToast } from '@/components/feedback';
import { PasswordInput } from '@/components/forms';
import { ScrollScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useChangePasswordMutation } from '@/features/auth';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError, ApiErrorCode } from '@/services/api';
import { useTheme } from '@/theme';

/** Mirrors the server's `passwordSchema` (10–128 characters). */
const MIN_LENGTH = 10;
const MAX_LENGTH = 128;

type Field = 'current' | 'next' | 'confirm';

/**
 * Route `/(app)/settings/change-password` — "تغيير كلمة المرور", for both the
 * Pet Owner and the Veterinarian interface. `POST /auth/change-password`
 * verifies the current password server-side; on success every other device
 * is signed out and this device keeps a fresh session. The typed values live
 * only in this screen's state and are cleared after a successful change.
 */
export default function ChangePasswordScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { t } = useTranslation('settings');
  const change = useChangePasswordMutation();

  const [values, setValues] = useState<Record<Field, string>>({
    current: '',
    next: '',
    confirm: '',
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const set = (field: Field) => (text: string) => {
    setValues((v) => ({ ...v, [field]: text }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = (): Partial<Record<Field, string>> => {
    const e: Partial<Record<Field, string>> = {};
    if (!values.current) e.current = t('password.required');
    if (!values.next) e.next = t('password.required');
    else if (values.next.length < MIN_LENGTH) e.next = t('password.tooShort');
    else if (values.next.length > MAX_LENGTH) e.next = t('password.tooLong');
    else if (values.next === values.current) e.next = t('password.sameAsCurrent');
    if (!values.confirm) e.confirm = t('password.required');
    else if (values.confirm !== values.next) e.confirm = t('password.mismatch');
    return e;
  };

  const submit = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    change.mutate(
      { currentPassword: values.current, newPassword: values.next },
      {
        onSuccess: () => {
          setValues({ current: '', next: '', confirm: '' });
          toast.show({ tone: 'success', message: t('password.success') });
          // web deep-link / refresh has no history — land on the settings menu
          if (router.canGoBack()) router.back();
          else router.replace(Routes.settings);
        },
        onError: (error) => {
          if (error instanceof ApiError && error.code === ApiErrorCode.INVALID_CURRENT_PASSWORD) {
            setErrors({ current: t('password.wrongCurrent') });
          } else if (error instanceof ApiError && error.code === ApiErrorCode.PASSWORD_UNCHANGED) {
            setErrors({ next: t('password.sameAsCurrent') });
          } else {
            toast.show({ tone: 'danger', message: apiErrorMessage(error) });
          }
        },
      },
    );
  };

  return (
    <ScrollScreen padded={false}>
      <AppHeader title={t('password.title')} showBack />
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
        <Caption color="textSecondary">{t('password.intro')}</Caption>
        <Card padding="lg">
          <View style={{ rowGap: theme.spacing.md }}>
            <PasswordInput
              label={t('password.current')}
              value={values.current}
              onChangeText={set('current')}
              error={errors.current}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="next"
            />
            <PasswordInput
              label={t('password.next')}
              value={values.next}
              onChangeText={set('next')}
              error={errors.next}
              hint={errors.next ? undefined : t('password.nextHint')}
              autoComplete="new-password"
              textContentType="newPassword"
              maxLength={MAX_LENGTH}
            />
            <PasswordInput
              label={t('password.confirm')}
              value={values.confirm}
              onChangeText={set('confirm')}
              error={errors.confirm}
              autoComplete="new-password"
              textContentType="newPassword"
              maxLength={MAX_LENGTH}
              returnKeyType="done"
              onSubmitEditing={submit}
            />
          </View>
        </Card>
        <Button
          label={t('password.submit')}
          leftIcon="key-outline"
          fullWidth
          loading={change.isPending}
          disabled={change.isPending}
          onPress={submit}
        />
      </View>
    </ScrollScreen>
  );
}
