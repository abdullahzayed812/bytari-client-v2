import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { Row } from '@/components/layout';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { AuthScreenLayout, FormField } from '../components';
import { authErrorMessage, fieldErrors } from '../errors';
import { useRegisterMutation } from '../hooks';
import { buildRegisterSchema, type RegisterFormValues } from '../validation/schemas';

/** RTL registration screen (§9). Only backend-supported fields. */
export default function RegisterScreen() {
  const theme = useTheme();
  const { t } = useTranslation('auth');
  const schema = useMemo(() => buildRegisterSchema(t), [t]);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  const { control, handleSubmit } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', password: '' },
    mode: 'onTouched',
  });

  const register = useRegisterMutation();

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    setServerFields({});
    register.mutate(
      {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
        phone: values.phone.trim(),
      },
      {
        onError: (error) => {
          setServerFields(fieldErrors(error));
          setFormError(authErrorMessage(error, 'register'));
        },
      },
    );
  });

  return (
    <AuthScreenLayout
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      footer={
        <Row gap="xs" justify="center">
          <Caption>{t('register.haveAccount')}</Caption>
          <TextButton
            label={t('register.goLogin')}
            onPress={() => router.replace(Routes.authSignIn)}
          />
        </Row>
      }
    >
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <Row gap="md" align="flex-start">
        <View style={{ flex: 1 }}>
          <FormField
            control={control}
            name="firstName"
            label={t('register.firstNameLabel')}
            placeholder={t('register.firstNamePlaceholder')}
            autoCapitalize="words"
            textContentType="givenName"
            returnKeyType="next"
            serverError={serverFields.firstName}
          />
        </View>
        <View style={{ flex: 1 }}>
          <FormField
            control={control}
            name="lastName"
            label={t('register.lastNameLabel')}
            placeholder={t('register.lastNamePlaceholder')}
            autoCapitalize="words"
            textContentType="familyName"
            returnKeyType="next"
            serverError={serverFields.lastName}
          />
        </View>
      </Row>

      <FormField
        control={control}
        name="email"
        label={t('register.emailLabel')}
        placeholder={t('register.emailPlaceholder')}
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
        name="phone"
        label={t('register.phoneLabel')}
        placeholder={t('register.phonePlaceholder')}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="next"
        leftIcon="call-outline"
        serverError={serverFields.phone}
      />

      <FormField
        control={control}
        name="password"
        secure
        label={t('register.passwordLabel')}
        placeholder={t('register.passwordPlaceholder')}
        hint={t('register.passwordHint')}
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
        serverError={serverFields.password}
      />

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={t('register.submit')}
          fullWidth
          loading={register.isPending}
          onPress={onSubmit}
          accessibilityLabel={t('register.submit')}
        />
      </View>
    </AuthScreenLayout>
  );
}
