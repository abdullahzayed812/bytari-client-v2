import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert, useToast } from '@/components/feedback';
import { FormField, Select } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useVeterinarianStatus } from '@/features/auth';
import { useAuth } from '@/hooks';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';
import type { LocalFile } from '@/services/files/types';
import { useTheme } from '@/theme';

import { LocalImagePicker, RegistrationSectionHeader } from '../components';
import { COUNTRIES_AR } from '../data/countries';
import { devRegistrationDefaults } from '../data/devDefaults';
import { useCreateOrganization } from '../hooks';
import { uploadGalleryPhotos, uploadLicenseDocuments } from '../lib/registrationUploads';
import type { CreateOrganizationDetailsInput } from '../types';
import {
  buildRegistrationSchema,
  servicesToArray,
  type RegistrationFormValues,
} from '../validation/schemas';

const COUNTRY_OPTIONS = COUNTRIES_AR.map((c) => ({ label: c, value: c }));
const LICENSE_IMAGES_MAX = 3;
const GALLERY_IMAGES_MAX = 5;

export type RegistrableOrganizationType = 'CLINIC' | 'VETERINARY_OFFICE';

interface Props {
  orgType: RegistrableOrganizationType;
}

/**
 * Shared "تسجيل العيادة" / "تسجيل المكتب" registration screen. The backend
 * requires admin/supervisor approval before either becomes ACTIVE (identical
 * lifecycle to Farms) — the full profile is captured here in one submission
 * (`details` on create), since the owner cannot `PATCH` while PENDING. Gallery
 * + license-document photos are picked locally first, then uploaded in a loop
 * right after creation succeeds (`../lib/registrationUploads`).
 *
 * Field sets differ slightly per the reference screenshots: CLINIC shows
 * "الخدمات" and keeps "ساعات العمل" in the Contact Info section with a
 * required phone; VETERINARY_OFFICE has no services field, moves working
 * hours into Contact Links, and phone is optional.
 */
export function OrganizationRegistrationScreen({ orgType }: Props) {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const toast = useToast();
  const { refreshSession } = useAuth();
  const vet = useVeterinarianStatus();
  const create = useCreateOrganization();
  const inFlight = useRef(false);

  const isClinic = orgType === 'CLINIC';
  const title = t(isClinic ? 'registration.clinic.title' : 'registration.office.title');
  const intro = t(isClinic ? 'registration.clinic.intro' : 'registration.office.intro');
  const nameLabel = t(isClinic ? 'registration.clinic.nameLabel' : 'registration.office.nameLabel');
  const namePlaceholder = t(
    isClinic ? 'registration.clinic.namePlaceholder' : 'registration.office.namePlaceholder',
  );
  const descriptionPlaceholder = t(
    isClinic ? 'registration.clinic.descriptionPlaceholder' : 'registration.office.descriptionPlaceholder',
  );
  const addressPlaceholder = t(
    isClinic ? 'registration.clinic.addressPlaceholder' : 'registration.office.addressPlaceholder',
  );
  const websitePlaceholder = t(
    isClinic ? 'registration.clinic.websitePlaceholder' : 'registration.office.websitePlaceholder',
  );
  const licenseNumberPlaceholder = t(
    isClinic
      ? 'registration.clinic.licenseNumberPlaceholder'
      : 'registration.office.licenseNumberPlaceholder',
  );
  const imagesTitle = t(isClinic ? 'registration.clinic.imagesTitle' : 'registration.office.imagesTitle');
  const vetGated = isClinic && !vet.isApproved;

  const [licenseImages, setLicenseImages] = useState<LocalFile[]>([]);
  const [galleryImages, setGalleryImages] = useState<LocalFile[]>([]);
  const [licenseImagesError, setLicenseImagesError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(
    () => buildRegistrationSchema(t, { phoneRequired: isClinic }),
    [t, isClinic],
  );
  const { control, handleSubmit } = useForm<RegistrationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      country: '',
      phone: '',
      email: '',
      workingHours: '',
      services: '',
      websiteUrl: '',
      facebookUrl: '',
      instagramUrl: '',
      whatsapp: '',
      licenseNumber: '',
      ...(devDataEnabled ? devRegistrationDefaults(isClinic) : null),
    },
    mode: 'onTouched',
  });

  const onSubmit = (values: RegistrationFormValues) => {
    if (inFlight.current || create.isPending || vetGated) return;
    if (licenseImages.length === 0) {
      setLicenseImagesError(t('registration.errors.licenseImagesRequired'));
      return;
    }
    setLicenseImagesError(null);
    setFormError(null);
    setServerFields({});
    inFlight.current = true;
    setSubmitting(true);

    const details: CreateOrganizationDetailsInput = {
      address: values.address.trim(),
      country: values.country.trim(),
      phone: values.phone?.trim() ? values.phone.trim() : null,
      email: values.email?.trim() ? values.email.trim() : null,
      workingHours: values.workingHours?.trim() ? values.workingHours.trim() : null,
      services: isClinic ? servicesToArray(values.services) : undefined,
      websiteUrl: values.websiteUrl?.trim() ? values.websiteUrl.trim() : null,
      facebookUrl: values.facebookUrl?.trim() ? values.facebookUrl.trim() : null,
      instagramUrl: values.instagramUrl?.trim() ? values.instagramUrl.trim() : null,
      whatsapp: values.whatsapp?.trim() ? values.whatsapp.trim() : null,
      licenseNumber: values.licenseNumber.trim(),
    };

    create.mutate(
      {
        type: orgType,
        name: values.name.trim(),
        description: values.description?.trim() ? values.description.trim() : undefined,
        details,
      },
      {
        onSuccess: async (org) => {
          try {
            await uploadLicenseDocuments(org.id, licenseImages);
            if (galleryImages.length > 0) {
              await uploadGalleryPhotos(org.id, galleryImages);
            }
            toast.show({ tone: 'success', message: t('registration.success') });
          } catch {
            toast.show({ tone: 'warning', message: t('registration.uploadPartialError') });
          }
          void refreshSession();
          setSubmitting(false);
          inFlight.current = false;
          router.replace(Routes.organizationDetail(org.id));
        },
        onError: (error) => {
          setServerFields(fieldErrors(error));
          setFormError(apiErrorMessage(error));
          setSubmitting(false);
          inFlight.current = false;
        },
      },
    );
  };

  const workingHoursField = (
    <FormField
      control={control}
      name="workingHours"
      label={t('registration.fields.workingHours')}
      placeholder={t('registration.fields.workingHoursPlaceholder')}
      leftIcon="time-outline"
      serverError={serverFields['details.workingHours']}
    />
  );

  return (
    <SafeAreaScreen>
      <AppHeader title={title} showBack />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={theme.sizes.headerHeight}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: theme.screenPadding,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.lg,
          }}
        >
          <Caption>{intro}</Caption>

          {formError ? <Alert tone="danger" message={formError} /> : null}
          {vetGated ? (
            <Alert tone="warning" message={t('registration.clinic.vetApprovalRequired')} />
          ) : null}

          <RegistrationSectionHeader icon="business-outline" title={t('registration.sections.basicInfo')} required />
          <FormField
            control={control}
            name="name"
            label={nameLabel}
            placeholder={namePlaceholder}
            leftIcon="text-outline"
            autoCapitalize="words"
            returnKeyType="next"
            required
            serverError={serverFields.name}
          />
          <FormField
            control={control}
            name="description"
            label={t('registration.fields.description')}
            placeholder={descriptionPlaceholder}
            leftIcon="document-text-outline"
            multiline
            numberOfLines={3}
            serverError={serverFields.description}
          />

          <RegistrationSectionHeader icon="call-outline" title={t('registration.sections.contactInfo')} required />
          <FormField
            control={control}
            name="address"
            label={t('registration.fields.address')}
            placeholder={addressPlaceholder}
            leftIcon="location-outline"
            required
            serverError={serverFields['details.address']}
          />
          <Controller
            control={control}
            name="country"
            render={({ field: { value, onChange }, fieldState }) => (
              <Select<string>
                label={t('registration.fields.country')}
                placeholder={t('registration.fields.countryPlaceholder')}
                value={value || null}
                options={COUNTRY_OPTIONS}
                onChange={onChange}
                error={fieldState.error?.message ?? serverFields['details.country']}
                required
              />
            )}
          />
          <FormField
            control={control}
            name="phone"
            label={t('registration.fields.phone')}
            placeholder={t('registration.fields.phonePlaceholder')}
            leftIcon="call-outline"
            keyboardType="phone-pad"
            required={isClinic}
            serverError={serverFields['details.phone']}
          />
          <FormField
            control={control}
            name="email"
            label={t('registration.fields.email')}
            placeholder={t('registration.fields.emailPlaceholder')}
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            serverError={serverFields['details.email']}
          />
          {isClinic ? workingHoursField : null}
          {isClinic ? (
            <FormField
              control={control}
              name="services"
              label={t('registration.fields.services')}
              placeholder={t('registration.fields.servicesPlaceholder')}
              leftIcon="medkit-outline"
              serverError={serverFields['details.services']}
            />
          ) : null}

          <RegistrationSectionHeader icon="link-outline" title={t('registration.sections.contactLinks')} />
          {!isClinic ? workingHoursField : null}
          <FormField
            control={control}
            name="websiteUrl"
            label={t('registration.fields.website')}
            placeholder={websitePlaceholder}
            leftIcon="globe-outline"
            autoCapitalize="none"
            keyboardType="url"
            serverError={serverFields['details.websiteUrl']}
          />
          <FormField
            control={control}
            name="facebookUrl"
            label={t('registration.fields.facebook')}
            placeholder={t('registration.fields.facebookPlaceholder')}
            leftIcon="logo-facebook"
            autoCapitalize="none"
            keyboardType="url"
            serverError={serverFields['details.facebookUrl']}
          />
          <FormField
            control={control}
            name="instagramUrl"
            label={t('registration.fields.instagram')}
            placeholder={t('registration.fields.instagramPlaceholder')}
            leftIcon="logo-instagram"
            autoCapitalize="none"
            keyboardType="url"
            serverError={serverFields['details.instagramUrl']}
          />
          <FormField
            control={control}
            name="whatsapp"
            label={t('registration.fields.whatsapp')}
            placeholder={t('registration.fields.whatsappPlaceholder')}
            leftIcon="logo-whatsapp"
            keyboardType="phone-pad"
            serverError={serverFields['details.whatsapp']}
          />

          <RegistrationSectionHeader icon="document-text-outline" title={t('registration.sections.licenseInfo')} required />
          <FormField
            control={control}
            name="licenseNumber"
            label={t('registration.fields.licenseNumber')}
            placeholder={licenseNumberPlaceholder}
            leftIcon="document-text-outline"
            required
            serverError={serverFields['details.licenseNumber']}
          />
          <LocalImagePicker
            label={t('registration.fields.licenseImages')}
            hint={licenseImagesError ?? undefined}
            files={licenseImages}
            onChange={(files) => {
              setLicenseImages(files);
              if (files.length > 0) setLicenseImagesError(null);
            }}
            max={LICENSE_IMAGES_MAX}
            disabled={submitting}
          />

          <RegistrationSectionHeader icon="images-outline" title={imagesTitle} />
          <LocalImagePicker
            label={imagesTitle}
            files={galleryImages}
            onChange={setGalleryImages}
            max={GALLERY_IMAGES_MAX}
            disabled={submitting}
          />

          <View style={{ marginTop: theme.spacing.sm }}>
            <Button
              label={t('registration.submit')}
              fullWidth
              loading={submitting}
              disabled={submitting || vetGated}
              onPress={handleSubmit(onSubmit)}
              accessibilityLabel={t('registration.submit')}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaScreen>
  );
}
