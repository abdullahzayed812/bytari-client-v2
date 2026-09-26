import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Alert, useToast } from '@/components/feedback';
import { Checkbox, FormField } from '@/components/forms';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { LocalImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Label } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { authErrorMessage, fieldErrors, useRegisterMutation } from '@/features/auth';
import { apiErrorMessage } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';
import type { LocalFile } from '@/services/files/types';
import { useTheme } from '@/theme';

import {
  CountrySelect,
  GenderRadioGroup,
  GovernorateSelect,
  TermsAndConditionsModal,
} from '../components';
import { devPetOwnerDefaults } from '../data/devDefaults';
import { uploadRegistrationAvatar } from '../hooks';
import { buildPetOwnerSchema, type PetOwnerFormValues } from '../validation/schemas';

/**
 * Route `/(auth)/register` (A-06) — Pet Owner registration. A single,
 * long-scroll form (not a wizard), following the same RHF + zod +
 * `authErrorMessage`/`fieldErrors` pattern as the rest of the auth screens.
 *
 * The photo is picked LOCALLY (`LocalImageUploader`) — there is no account,
 * and so no session, to upload it with until `register()` returns. It is
 * uploaded right after that succeeds, using the token `register()` DOES
 * return (real, but scoped to registration self-service — see
 * `AuthResult`'s doc comment); a failed upload is a non-blocking toast, never
 * a reason to fail the whole registration. `AuthRedirector` takes it from
 * here to the verify-email screen once `register()` resolves.
 */
export default function PetOwnerRegisterScreen() {
  const theme = useTheme();
  const { t } = useTranslation('registration');
  const { t: tAuth } = useTranslation('auth');
  const toast = useToast();
  const schema = useMemo(() => buildPetOwnerSchema(t), [t]);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [avatarFile, setAvatarFile] = useState<LocalFile | null>(null);

  const { control, handleSubmit, setValue } = useForm<PetOwnerFormValues>({
    resolver: zodResolver(schema),
    // DEV-ONLY: pre-filled so the form doesn't need retyping on every test
    // run. Never covers the avatar — that needs a real uploaded image.
    defaultValues: devDataEnabled
      ? devPetOwnerDefaults()
      : {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          country: 'IQ',
          governorate: '',
          gender: undefined,
          terms: false,
        },
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
        gender: values.gender,
        country: values.country,
        governorate: values.governorate.trim(),
      },
      {
        onSuccess: async () => {
          if (avatarFile) {
            try {
              await uploadRegistrationAvatar(avatarFile);
            } catch (error) {
              toast.show({ message: apiErrorMessage(error), tone: 'warning' });
            }
          }
          // `AuthRedirector` takes it from here — the store already flipped
          // to `pending-verification` inside `register.mutate`'s promise.
          router.replace({ pathname: Routes.authVerifyEmail, params: { outcome: 'owner' } });
        },
        onError: (error) => {
          setServerFields(fieldErrors(error));
          setFormError(authErrorMessage(error, 'register'));
        },
      },
    );
  });

  return (
    <ScrollScreen>
      <AppHeader title={t('petOwner.title')} showBack backAlign="left" />

      <Section spacing="xl" style={{ rowGap: theme.spacing.lg }}>
        {formError ? <Alert tone="danger" message={formError} /> : null}

        <Label color="primary">{t('petOwner.personalInfoSection')}</Label>

        <View style={{ alignItems: 'center' }}>
          <LocalImageUploader
            shape="circle"
            size={96}
            value={avatarFile}
            onChange={setAvatarFile}
            label={t('petOwner.photoLabel')}
          />
        </View>

        <Row gap="md" align="flex-start">
          <View style={{ flex: 1 }}>
            <FormField
              control={control}
              name="firstName"
              label={tAuth('register.firstNameLabel')}
              placeholder={tAuth('register.firstNamePlaceholder')}
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
              label={tAuth('register.lastNameLabel')}
              placeholder={tAuth('register.lastNamePlaceholder')}
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
          label={tAuth('register.emailLabel')}
          placeholder={tAuth('register.emailPlaceholder')}
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
          label={tAuth('register.phoneLabel')}
          placeholder={tAuth('register.phonePlaceholder')}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="next"
          leftIcon="phone-portrait-outline"
          serverError={serverFields.phone}
        />

        <FormField
          control={control}
          name="password"
          secure
          label={tAuth('register.passwordLabel')}
          placeholder={tAuth('register.passwordPlaceholder')}
          hint={tAuth('register.passwordHint')}
          autoComplete="new-password"
          returnKeyType="next"
          serverError={serverFields.password}
        />

        <FormField
          control={control}
          name="confirmPassword"
          secure
          label={t('petOwner.confirmPasswordLabel')}
          placeholder={t('petOwner.confirmPasswordPlaceholder')}
          autoComplete="new-password"
          returnKeyType="next"
        />

        <CountrySelect
          control={control}
          name="country"
          label={t('petOwner.countryLabel')}
          placeholder={t('petOwner.countryPlaceholder')}
          serverError={serverFields.country}
        />

        <GovernorateSelect
          control={control}
          name="governorate"
          countryName="country"
          label={t('petOwner.governorateLabel')}
          placeholder={t('petOwner.governoratePlaceholder')}
          selectCountryFirst={t('petOwner.governorateSelectCountryFirst')}
          serverError={serverFields.governorate}
        />

        <GenderRadioGroup control={control} name="gender" label={t('petOwner.genderLabel')} />

        <Controller
          control={control}
          name="terms"
          render={({ field: { value, onChange }, fieldState }) => (
            <View style={{ rowGap: theme.spacing.xs }}>
              <Checkbox
                label={t('petOwner.termsPrefix')}
                checked={value === true}
                onChange={onChange}
              />
              <Row gap="xs" style={{ paddingStart: 38 }}>
                <TextButton
                  label={t('petOwner.termsLink')}
                  onPress={() => setTermsModalVisible(true)}
                />
                <TextButton
                  label={t('petOwner.privacyLink')}
                  onPress={() => setTermsModalVisible(true)}
                />
              </Row>
              {fieldState.error ? (
                <Caption color="danger">{fieldState.error.message}</Caption>
              ) : null}
            </View>
          )}
        />

        <View style={{ marginTop: theme.spacing.sm }}>
          <Button
            label={t('petOwner.submit')}
            fullWidth
            loading={register.isPending}
            disabled={register.isPending}
            onPress={onSubmit}
            accessibilityLabel={t('petOwner.submit')}
          />
        </View>
      </Section>

      <TermsAndConditionsModal
        visible={termsModalVisible}
        accountType="pet_owner"
        onClose={() => setTermsModalVisible(false)}
        onAccept={() => {
          setValue('terms', true, { shouldValidate: true });
          setTermsModalVisible(false);
        }}
      />
    </ScrollScreen>
  );
}
