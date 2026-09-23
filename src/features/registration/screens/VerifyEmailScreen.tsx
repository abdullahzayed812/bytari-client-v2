import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, TextButton } from '@/components/actions';
import { Alert, useToast } from '@/components/feedback';
import { Input } from '@/components/forms';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { authErrorMessage, useAuth, useResendVerificationMutation, useVerifyEmailMutation } from '@/features/auth';
import { useTheme } from '@/theme';

import type { RegistrationOutcome } from '../types';

/** Fallback disable window after a resend hits the cooldown 429 — we don't have the server's exact remaining seconds from that response, just its own configured default (mirrors the backend's `EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS` default). A stale guess here never under-protects: the backend still enforces the real cooldown regardless of what this button shows. */
const FALLBACK_RESEND_COOLDOWN_SECONDS = 60;

/**
 * Route `/(auth)/verify-email` — mandatory email-verification step. Reached
 * from three places: right after Pet Owner registration, right after a
 * veterinarian application is submitted, and when `LoginScreen` catches
 * `EMAIL_VERIFICATION_REQUIRED` on an existing unverified account.
 * `AuthRedirector` also routes here on its own whenever
 * `status === 'pending-verification'` (e.g. resuming a pending session after
 * an app restart).
 *
 * The email to verify comes from `user?.email` (registration already
 * established a — scoped — session, so `useAuth().user` is populated) with a
 * `?email=` route param as the fallback for the login-blocked case, which has
 * no session at all yet.
 *
 * On success, `verifyEmail()` establishes a full session itself (same shape
 * as `login()`). If this screen was reached from registration (`outcome` is
 * set), it forwards to `RegistrationSuccessScreen`; otherwise (the
 * login-blocked case) there is nothing left to do — `AuthRedirector` takes
 * the now-`authenticated` status straight to the app.
 */
export default function VerifyEmailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('registration');
  const { email: emailParam, outcome } = useLocalSearchParams<{
    email?: string;
    outcome?: RegistrationOutcome;
  }>();
  const { user } = useAuth();
  const email = emailParam ?? user?.email ?? '';
  const toast = useToast();

  const [code, setCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const verify = useVerifyEmailMutation();
  const resend = useResendVerificationMutation();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const submit = () => {
    setFormError(null);
    if (!/^\d{6}$/.test(code)) {
      setFormError(t('verifyEmail.errors.codeRequired'));
      return;
    }
    verify.mutate(
      { email, code },
      {
        onSuccess: () => {
          if (outcome) {
            router.replace({ pathname: Routes.authRegisterSuccess, params: { outcome } });
          }
          // else: AuthRedirector takes the now-`authenticated` status home.
        },
        onError: (error) => setFormError(authErrorMessage(error)),
      },
    );
  };

  const onResend = () => {
    setFormError(null);
    resend.mutate(email, {
      onSuccess: (result) => {
        setResendCooldown(result.resendAvailableInSeconds);
        toast.show({ message: t('verifyEmail.resendSuccess'), tone: 'success' });
      },
      onError: (error) => {
        setFormError(authErrorMessage(error));
        setResendCooldown(FALLBACK_RESEND_COOLDOWN_SECONDS);
      },
    });
  };

  return (
    <ScrollScreen>
      <AppHeader title={t('verifyEmail.title')} showBack backAlign="left" />

      <Section spacing="xl" style={{ rowGap: theme.spacing.lg }}>
        <Caption>{t('verifyEmail.subtitle', { email })}</Caption>

        {formError ? <Alert tone="danger" message={formError} /> : null}

        <Input
          label={t('verifyEmail.codeLabel')}
          placeholder={t('verifyEmail.codePlaceholder')}
          value={code}
          onChangeText={(next) => setCode(next.replace(/[^\d]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />

        <Button
          label={t('verifyEmail.submit')}
          fullWidth
          loading={verify.isPending}
          disabled={verify.isPending}
          onPress={submit}
          accessibilityLabel={t('verifyEmail.submit')}
        />

        <Row gap="xs" justify="center">
          <Caption>{t('verifyEmail.resendPrompt')}</Caption>
          {resendCooldown > 0 ? (
            <Caption color="textMuted">{t('verifyEmail.resendIn', { seconds: resendCooldown })}</Caption>
          ) : (
            <TextButton
              label={t('verifyEmail.resend')}
              disabled={resend.isPending}
              onPress={onResend}
            />
          )}
        </Row>
      </Section>
    </ScrollScreen>
  );
}
