import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Alert, useToast } from '@/components/feedback';
import { Checkbox, FormField, SegmentedControl } from '@/components/forms';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { LocalImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { authErrorMessage, fieldErrors, useRegisterMutation } from '@/features/auth';
import type { ApplyForVeterinarianInput, VeterinarianDocumentKind } from '@/features/veterinarian';
import { apiErrorMessage } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';
import type { LocalFile } from '@/services/files/types';
import { useTheme } from '@/theme';

import {
  CountrySelect,
  DocumentUploadTile,
  GenderRadioGroup,
  GovernorateSelect,
  TermsAndConditionsModal,
} from '../components';
import { devVeterinarianDefaults } from '../data/devDefaults';
import {
  uploadRegistrationAvatar,
  uploadRegistrationDocument,
  useSubmitVeterinarianApplication,
} from '../hooks';
import { buildVeterinarianSchema, type VeterinarianFormValues } from '../validation/schemas';

type SubmitStage = 'form' | 'apply-error';

/** Upload every staged document slot for `values.subType`, batched, right after `register()` succeeds. */
async function uploadDocuments(
  values: VeterinarianFormValues,
): Promise<ApplyForVeterinarianInput['documents']> {
  const slots: { kind: VeterinarianDocumentKind; file?: LocalFile }[] =
    values.subType === 'VETERINARIAN'
      ? [
          { kind: 'LICENSE_OR_ID', file: values.licenseOrId },
          { kind: 'ADDITIONAL_ID', file: values.additionalId },
        ]
      : [
          { kind: 'STUDENT_ID_FRONT', file: values.studentIdFront },
          { kind: 'STUDENT_ID_BACK', file: values.studentIdBack },
        ];
  const staged = slots.filter((slot): slot is { kind: VeterinarianDocumentKind; file: LocalFile } =>
    Boolean(slot.file),
  );
  const uploaded = await Promise.all(
    staged.map((slot) => uploadRegistrationDocument(slot.kind, slot.file)),
  );
  return uploaded.map(({ kind, storageKey, filename, mimeType }) => ({
    kind,
    storageKey,
    filename,
    mimeType,
  }));
}

/**
 * Route `/(auth)/register-veterinarian` (A-05/07/08/09 — one screen, not a
 * wizard) — Veterinarian / Veterinary-student registration. Same personal-info
 * fields as `PetOwnerRegisterScreen` plus a `subType` toggle and the two
 * document slots it requires.
 *
 * The avatar and every document slot are picked LOCALLY (`LocalImageUploader`
 * / `DocumentUploadTile`) — there is no account, and so no session, to upload
 * them with until `register()` returns. Submit then runs, in sequence:
 *   1. `register()` — creates + signs the user in (same as the pet-owner flow).
 *   2. Upload the avatar (best-effort, non-fatal) and every staged document
 *      (required — a failure here routes to the same `apply-error` retry UI
 *      as an `apply()` failure, since the files are still sitting in RHF
 *      state and safe to re-upload).
 *   3. `apply()` — submits the veterinarian application with the uploaded
 *      document storage keys.
 * If (1) fails, nothing else runs. If (2) or (3) fails AFTER (1) already
 * succeeded, the account exists — retrying re-runs (2) and (3) only (never
 * `register()` again).
 */
export default function VeterinarianRegisterScreen() {
  const theme = useTheme();
  const { t } = useTranslation('registration');
  const { t: tAuth } = useTranslation('auth');
  const toast = useToast();
  const schema = useMemo(() => buildVeterinarianSchema(t), [t]);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<SubmitStage>('form');
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [avatarFile, setAvatarFile] = useState<LocalFile | null>(null);

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
            country: 'IQ',
            governorate: '',
            gender: undefined,
            terms: false,
            subType: 'VETERINARIAN',
            specialization: '',
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

  const submitApplication = async (values: VeterinarianFormValues) => {
    let documents: ApplyForVeterinarianInput['documents'];
    try {
      documents = await uploadDocuments(values);
    } catch (error) {
      setStage('apply-error');
      setFormError(apiErrorMessage(error));
      return;
    }
    applyMutation.mutate(
      { note: undefined, subType: values.subType, documents },
      {
        onSuccess: () => {
          // Veterinarians skip email verification — the account is gated by
          // admin approval instead, so the next (and only) stop is the
          // pending-approval screen until an admin approves.
          router.replace(Routes.authVeterinarianPending);
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
        specialization: values.specialization?.trim() ? values.specialization.trim() : undefined,
        // No email verification for veterinarians — admin approval gates the account instead.
        accountType: 'VETERINARIAN',
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
          await submitApplication(values);
        },
        onError: (error) => {
          setServerFields(fieldErrors(error));
          setFormError(authErrorMessage(error, 'register'));
        },
      },
    );
  });

  const retryApplyOnly = () => {
    setFormError(null);
    void submitApplication(getValues());
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

        <FormField
          control={control}
          name="specialization"
          label={t('veterinarian.specializationLabel')}
          placeholder={t('veterinarian.specializationPlaceholder')}
          returnKeyType="next"
          serverError={serverFields.specialization}
          editable={stage !== 'apply-error'}
        />

        <View style={{ rowGap: theme.spacing.md }}>
          <Text variant="bodyStrong">{t('veterinarian.documentsSection')}</Text>

          {subType === 'VETERINARIAN' ? (
            <>
              <Controller
                control={control}
                name="licenseOrId"
                render={({ field: { value, onChange }, fieldState }) => (
                  <DocumentUploadTile
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
