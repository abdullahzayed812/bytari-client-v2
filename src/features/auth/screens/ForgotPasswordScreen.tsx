import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, TextButton } from '@/components/actions';
import { Alert, useToast } from '@/components/feedback';
import { Input, PasswordInput } from '@/components/forms';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { authErrorMessage } from '../errors';
import { useForgotPasswordMutation, useResetPasswordMutation } from '../hooks';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 10;
const MAX_PASSWORD = 128;
/** Fallback when a resend hits the cooldown 429 — the backend still enforces the real value. */
const FALLBACK_RESEND_COOLDOWN_SECONDS = 60;

type Step = 'email' | 'reset';

/**
 * Route `/(auth)/forgot-password` — two steps on one screen:
 *   1. email → `POST /auth/forgot-password` (uniform response; an unknown
 *      email is indistinguishable, so the copy says "if registered…").
 *   2. 6-digit code + new password → `POST /auth/reset-password`. The backend
 *      revokes every session; on success the user is sent to sign in.
 * Resend honours the server-returned cooldown.
 */
export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const { t } = useTranslation('auth');
  const toast = useToast();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(emailParam ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const requestCode = useForgotPasswordMutation();
  const resetPassword = useResetPasswordMutation();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const sendCode = (isResend: boolean) => {
    setFormError(null);
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setFormError(t('errors.emailInvalid'));
      return;
    }
    requestCode.mutate(trimmed, {
      onSuccess: (result) => {
        setCooldown(result.resendAvailableInSeconds);
        setStep('reset');
        toast.show({
          message: isResend ? t('forgotPassword.resendSuccess') : t('forgotPassword.codeSent'),
          tone: 'success',
        });
      },
      onError: (error) => {
        setFormError(authErrorMessage(error));
        setCooldown(FALLBACK_RESEND_COOLDOWN_SECONDS);
      },
    });
  };

  const submitReset = () => {
    setFormError(null);
    if (!/^\d{6}$/.test(code)) {
      setFormError(t('forgotPassword.errors.codeRequired'));
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setFormError(t('errors.passwordTooShort'));
      return;
    }
    if (password.length > MAX_PASSWORD) {
      setFormError(t('errors.passwordInvalid'));
      return;
    }
    if (password !== confirm) {
      setFormError(t('forgotPassword.errors.passwordMismatch'));
      return;
    }
    resetPassword.mutate(
      { email: email.trim(), code, newPassword: password },
      {
        onSuccess: () => {
          toast.show({ message: t('forgotPassword.success'), tone: 'success' });
          router.replace(Routes.authSignIn);
        },
        onError: (error) => setFormError(authErrorMessage(error)),
      },
    );
  };

  return (
    <ScrollScreen>
      <AppHeader
        title={step === 'email' ? t('forgotPassword.title') : t('forgotPassword.resetTitle')}
        showBack
        backAlign="left"
      />

      <Section spacing="xl" style={{ rowGap: theme.spacing.lg }}>
        {formError ? <Alert tone="danger" message={formError} /> : null}

        {step === 'email' ? (
          <>
            <Caption>{t('forgotPassword.subtitle')}</Caption>
            <Input
              label={t('login.emailLabel')}
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              leftIcon="mail-outline"
              returnKeyType="go"
              onSubmitEditing={() => sendCode(false)}
            />
            <Button
              label={t('forgotPassword.sendCode')}
              fullWidth
              loading={requestCode.isPending}
              disabled={requestCode.isPending}
              onPress={() => sendCode(false)}
              accessibilityLabel={t('forgotPassword.sendCode')}
            />
          </>
        ) : (
          <>
            <Caption>{t('forgotPassword.resetSubtitle', { email: email.trim() })}</Caption>
            <Input
              label={t('forgotPassword.codeLabel')}
              placeholder={t('forgotPassword.codePlaceholder')}
              value={code}
              onChangeText={(next) => setCode(next.replace(/[^\d]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <PasswordInput
              label={t('forgotPassword.newPasswordLabel')}
              placeholder={t('register.passwordPlaceholder')}
              hint={t('register.passwordHint')}
              value={password}
              onChangeText={setPassword}
              autoComplete="new-password"
            />
            <PasswordInput
              label={t('forgotPassword.confirmPasswordLabel')}
              value={confirm}
              onChangeText={setConfirm}
              autoComplete="new-password"
              returnKeyType="go"
              onSubmitEditing={submitReset}
            />
            <Button
              label={t('forgotPassword.submit')}
              fullWidth
              loading={resetPassword.isPending}
              disabled={resetPassword.isPending}
              onPress={submitReset}
              accessibilityLabel={t('forgotPassword.submit')}
            />
            <Row gap="md" justify="center">
              {cooldown > 0 ? (
                <Caption color="textMuted">
                  {t('forgotPassword.resendIn', { seconds: cooldown })}
                </Caption>
              ) : (
                <TextButton
                  label={t('forgotPassword.resend')}
                  disabled={requestCode.isPending}
                  onPress={() => sendCode(true)}
                />
              )}
              <TextButton
                label={t('forgotPassword.changeEmail')}
                onPress={() => {
                  setFormError(null);
                  setCode('');
                  setStep('email');
                }}
              />
            </Row>
          </>
        )}

        <TextButton
          label={t('forgotPassword.backToLogin')}
          onPress={() => router.replace(Routes.authSignIn)}
        />
      </Section>
    </ScrollScreen>
  );
}
