import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { Checkbox } from '@/components/forms';
import { Row } from '@/components/layout';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
// Imported from the component file directly (not the feature barrel) to avoid
// an auth ⇄ registration import cycle — the registration barrel re-exports
// hooks/screens that themselves import from `@/features/auth`.
import { SocialLoginButtons } from '@/features/registration/components/SocialLoginButtons';
import { ApiError, ApiErrorCode } from '@/services/api';
import { useTheme } from '@/theme';

import { AuthScreenLayout, DevAccountPicker, FormField } from '../components';
import { authErrorMessage, fieldErrors } from '../errors';
import { useLoginMutation } from '../hooks';
import { buildLoginSchema, type LoginFormValues } from '../validation/schemas';

/** RTL login screen (§10). Follows the Phase 1 design system. */
export default function LoginScreen() {
  const theme = useTheme();
  const { t } = useTranslation('auth');
  const schema = useMemo(() => buildLoginSchema(t), [t]);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const [rememberMe, setRememberMe] = useState(true);

  const { control, handleSubmit, setValue, getValues } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const login = useLoginMutation();

  const submit = (values: LoginFormValues) => {
    setFormError(null);
    setServerFields({});
    const email = values.email.trim();
    login.mutate(
      { email, password: values.password },
      {
        onError: (error) => {
          // Correct password, unverified account — no session was issued
          // (see `authStore.login`). Route straight to the verify screen
          // instead of showing this as a generic sign-in error.
          if (
            error instanceof ApiError &&
            error.code === ApiErrorCode.EMAIL_VERIFICATION_REQUIRED
          ) {
            router.replace({ pathname: Routes.authVerifyEmail, params: { email } });
            return;
          }
          setServerFields(fieldErrors(error));
          setFormError(authErrorMessage(error, 'login'));
        },
        // success → AuthRedirector handles navigation
      },
    );
  };

  const onSubmit = handleSubmit(submit);

  // DEV-ONLY: fill the form from a seed persona and log in via the normal flow.
  const onDevPick = (email: string, password: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    submit({ email, password });
  };

  return (
    <AuthScreenLayout
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      footer={
        <Row gap="xs" justify="center">
          <Caption>{t('login.noAccount')}</Caption>
          <TextButton
            label={t('login.goRegister')}
            onPress={() => router.replace(Routes.authRegister)}
          />
        </Row>
      }
    >
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <FormField
        control={control}
        name="email"
        label={t('login.emailLabel')}
        placeholder={t('login.emailPlaceholder')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        leftIcon="mail-outline"
        serverError={serverFields.email}
      />

      <FormField
        control={control}
        name="password"
        secure
        label={t('login.passwordLabel')}
        placeholder={t('login.passwordPlaceholder')}
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
        serverError={serverFields.password}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Checkbox label={t('login.rememberMe')} checked={rememberMe} onChange={setRememberMe} />
        </View>
        <TextButton
          label={t('login.forgotPassword')}
          onPress={() =>
            router.push({
              pathname: Routes.authForgotPassword,
              params: { email: getValues('email').trim() },
            })
          }
        />
      </View>

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={t('login.submit')}
          fullWidth
          loading={login.isPending}
          onPress={onSubmit}
          accessibilityLabel={t('login.submit')}
        />
      </View>

      {/*<View style={{ marginTop: theme.spacing.lg }}>
        <SocialLoginButtons />
      </View> 
      */}

      <DevAccountPicker onPick={onDevPick} disabled={login.isPending} />
    </AuthScreenLayout>
  );
}
