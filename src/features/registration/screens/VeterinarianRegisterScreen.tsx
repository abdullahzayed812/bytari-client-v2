import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { Checkbox, FormField, SegmentedControl } from '@/components/forms';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { ImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { authErrorMessage, fieldErrors, useRegisterMutation } from '@/features/auth';
import type { ApplyForVeterinarianInput } from '@/features/veterinarian';
import { apiErrorMessage } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';
import { useTheme } from '@/theme';

import {
  CountrySelect,
  DocumentUploadTile,
  GenderRadioGroup,
  TermsAndConditionsModal,
} from '../components';
import { devVeterinarianDefaults } from '../data/devDefaults';
import { useAvatarPresignProvider, useSubmitVeterinarianApplication } from '../hooks';
import { buildVeterinarianSchema, type VeterinarianFormValues } from '../validation/schemas';

type SubmitStage = 'form' | 'apply-error';

function buildDocuments(values: VeterinarianFormValues): ApplyForVeterinarianInput['documents'] {
  if (values.subType === 'VETERINARIAN') {
    const docs: ApplyForVeterinarianInput['documents'] = [];
    if (values.licenseOrId) docs.push({ kind: 'LICENSE_OR_ID', ...values.licenseOrId });
    if (values.additionalId) docs.push({ kind: 'ADDITIONAL_ID', ...values.additionalId });
    return docs;
  }
  const docs: ApplyForVeterinarianInput['documents'] = [];
  if (values.studentIdFront) docs.push({ kind: 'STUDENT_ID_FRONT', ...values.studentIdFront });
  if (values.studentIdBack) docs.push({ kind: 'STUDENT_ID_BACK', ...values.studentIdBack });
  return docs;
}

/**
 * Route `/(auth)/register-veterinarian` (A-05/07/08/09 — one screen, not a
 * wizard) — Veterinarian / Veterinary-student registration. Same personal-info
 * fields as `PetOwnerRegisterScreen` plus a `subType` toggle and the two
 * document slots it requires.
 *
 * Submit does two network calls in sequence:
 *   1. `register()` — creates + signs the user in (same as the pet-owner flow).
 *   2. `apply()` — submits the veterinarian application with the uploaded
 *      document storage keys.
 * If (1) fails, nothing else runs. If (2) fails AFTER (1) already succeeded,
 * the account exists — retrying re-runs ONLY the apply mutation (never
 * `register()` again), reusing the document refs already sitting in RHF state.
 */
export default function VeterinarianRegisterScreen() {
  const theme = useTheme();
  const { t } = useTranslation('registration');
  const { t: tAuth } = useTranslation('auth');
  const schema = useMemo(() => buildVeterinarianSchema(t), [t]);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<SubmitStage>('form');
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const avatarProvider = useAvatarPresignProvider();

  const { control, handleSubmit, watch, resetField, getValues, setValue } =
    useForm<VeterinarianFormValues>({
      resolver: zodResolver(schema),
      // DEV-ONLY: pre-filled so the form doesn't need retyping on every test
      // run. Never covers the avatar or documents — those need real uploaded
      // images/files.
      defaultValues: devDataEnabled
        ? {
            ...devVeterinarianDefaults(),
            subType: 'VETERINARIAN',
            licenseOrId: undefined,
            additionalId: undefined,
            studentIdFront: undefined,
            studentIdBack: undefined,
          }
        : {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            country: 'SA',
            gender: undefined,
            terms: false,
            subType: 'VETERINARIAN',
            licenseOrId: undefined,
            additionalId: undefined,
            studentIdFront: undefined,
            studentIdBack: undefined,
          },
      mode: 'onTouched',
    });

  const subType = watch('subType');
  const register = useRegisterMutation();
  const applyMutation = useSubmitVeterinarianApplication();

  const submitApplication = (values: VeterinarianFormValues) => {
    applyMutation.mutate(
      { note: undefined, subType: values.subType, documents: buildDocuments(values) },
      {
        onSuccess: () => {
          router.replace({
            pathname: Routes.authRegisterSuccess,
            params: { outcome: 'veterinarian-pending' },
          });
        },
        onError: (error) => {
          setStage('apply-error');
          setFormError(apiErrorMessage(error));
        },
      },
    );
  };

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    setServerFields({});
    const phone = values.phone?.trim();
    register.mutate(
      {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
        phone: phone ? phone : null,
        gender: values.gender,
        country: values.country,
      },
      {
        onSuccess: () => submitApplication(values),
        onError: (error) => {
          setServerFields(fieldErrors(error));
          setFormError(authErrorMessage(error, 'register'));
        },
      },
    );
  });

  const retryApplyOnly = () => {
    setFormError(null);
    submitApplication(getValues());
  };

  const busy = register.isPending || applyMutation.isPending;

  return (
    <ScrollScreen>
      <AppHeader title={t('veterinarian.title')} showBack backAlign="left" />

      <Section spacing="xl" style={{ rowGap: theme.spacing.lg }}>
        {formError ? <Alert tone="danger" message={formError} /> : null}

        {stage === 'apply-error' ? (
          <Alert tone="warning" message={t('veterinarian.accountCreatedRetryApply')} />
        ) : null}

        <Controller
          control={control}
          name="subType"
          render={({ field: { value, onChange } }) => (
            <SegmentedControl
              value={value}
              onChange={(next) => {
                onChange(next);
                resetField('licenseOrId');
                resetField('additionalId');
                resetField('studentIdFront');
                resetField('studentIdBack');
              }}
              disabled={stage === 'apply-error'}
              options={[
                { value: 'VETERINARIAN', label: t('veterinarian.subTypeVet') },
                { value: 'STUDENT', label: t('veterinarian.subTypeStudent') },
              ]}
            />
          )}
        />

        <Label color="primary">{t('petOwner.personalInfoSection')}</Label>

        <View style={{ alignItems: 'center' }}>
          <ImageUploader
            shape="circle"
            size={96}
            provider={avatarProvider}
            value={null}
            onChange={() => undefined}
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
              editable={stage !== 'apply-error'}
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
              editable={stage !== 'apply-error'}
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
          editable={stage !== 'apply-error'}
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
          editable={stage !== 'apply-error'}
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
          editable={stage !== 'apply-error'}
        />

        <FormField
          control={control}
          name="confirmPassword"
          secure
          label={t('petOwner.confirmPasswordLabel')}
          placeholder={t('petOwner.confirmPasswordPlaceholder')}
          autoComplete="new-password"
          returnKeyType="next"
          editable={stage !== 'apply-error'}
        />

        <CountrySelect
          control={control}
          name="country"
          label={t('petOwner.countryLabel')}
          placeholder={t('petOwner.countryPlaceholder')}
          serverError={serverFields.country}
        />

        <GenderRadioGroup control={control} name="gender" label={t('petOwner.genderLabel')} />

        <View style={{ rowGap: theme.spacing.md }}>
          <Text variant="bodyStrong">{t('veterinarian.documentsSection')}</Text>

          {subType === 'VETERINARIAN' ? (
            <>
              <Controller
                control={control}
                name="licenseOrId"
                render={({ field: { value, onChange }, fieldState }) => (
                  <DocumentUploadTile
                    kind="LICENSE_OR_ID"
                    label={t('veterinarian.licenseOrIdLabel')}
                    required
                    value={value ?? null}
                    onChange={onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="additionalId"
                render={({ field: { value, onChange }, fieldState }) => (
                  <DocumentUploadTile
                    kind="ADDITIONAL_ID"
                    label={t('veterinarian.additionalIdLabel')}
                    value={value ?? null}
                    onChange={onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </>
          ) : (
            <>
              <Controller
                control={control}
                name="studentIdFront"
                render={({ field: { value, onChange }, fieldState }) => (
                  <DocumentUploadTile
                    kind="STUDENT_ID_FRONT"
                    label={t('veterinarian.studentIdFrontLabel')}
                    required
                    value={value ?? null}
                    onChange={onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="studentIdBack"
                render={({ field: { value, onChange }, fieldState }) => (
                  <DocumentUploadTile
                    kind="STUDENT_ID_BACK"
                    label={t('veterinarian.studentIdBackLabel')}
                    required
                    value={value ?? null}
                    onChange={onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </>
          )}
        </View>

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

        <View style={{ marginTop: theme.spacing.sm, rowGap: theme.spacing.md }}>
          {stage === 'apply-error' ? (
            <Button
              label={t('veterinarian.retryApply')}
              fullWidth
              loading={applyMutation.isPending}
              disabled={applyMutation.isPending}
              onPress={retryApplyOnly}
              accessibilityLabel={t('veterinarian.retryApply')}
            />
          ) : (
            <Button
              label={t('veterinarian.submit')}
              fullWidth
              loading={busy}
              disabled={busy}
              onPress={onSubmit}
              accessibilityLabel={t('veterinarian.submit')}
            />
          )}
        </View>
      </Section>

      <TermsAndConditionsModal
        visible={termsModalVisible}
        accountType="veterinarian"
        onClose={() => setTermsModalVisible(false)}
        onAccept={() => {
          setValue('terms', true, { shouldValidate: true });
          setTermsModalVisible(false);
        }}
      />
    </ScrollScreen>
  );
}
