import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/actions';
import { Alert, ErrorState, Loading, useToast } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import {
  CountrySelect,
  GenderRadioGroup,
  GovernorateSelect,
} from '@/features/registration/components';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { useAdminUser, useUpdateUserMutation } from '../hooks';
import type { AdminUpdateUserInput, AdminUserDetail, Gender } from '../types';

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  governorate: string;
  gender: Gender | undefined;
  specialization: string;
}

function toForm(u: AdminUserDetail): FormValues {
  return {
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone ?? '',
    country: u.country ?? '',
    governorate: u.governorate ?? '',
    gender: u.gender ?? undefined,
    specialization: u.specialization ?? '',
  };
}

/** Only changed fields are sent; emptied optional fields become `null`. */
function diff(before: FormValues, after: FormValues): AdminUpdateUserInput {
  const out: AdminUpdateUserInput = {};
  const trim = (v: string) => v.trim();
  if (trim(after.firstName) !== before.firstName) out.firstName = trim(after.firstName);
  if (trim(after.lastName) !== before.lastName) out.lastName = trim(after.lastName);
  if (trim(after.email).toLowerCase() !== before.email) out.email = trim(after.email);
  if (trim(after.phone) !== before.phone) out.phone = trim(after.phone) || null;
  if (after.country !== before.country) out.country = after.country || null;
  if (trim(after.governorate) !== before.governorate)
    out.governorate = trim(after.governorate) || null;
  if (after.gender !== before.gender) out.gender = after.gender ?? null;
  if (trim(after.specialization) !== before.specialization) {
    out.specialization = trim(after.specialization) || null;
  }
  return out;
}

/**
 * Route `/(app)/admin/users/[userId]/edit` — admin edits a user's profile
 * (`PATCH /admin/users/:id`). Status, roles and password are NOT here — they
 * have their own audited actions on the detail screen. The backend validates
 * email uniqueness and the country → governorate pairing.
 */
export default function AdminUserEditScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { t } = useTranslation('admin');
  const { t: tr } = useTranslation('registration');
  const theme = useTheme();
  const toast = useToast();
  const q = useAdminUser(userId);
  const update = useUpdateUserMutation(userId);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: q.data ? toForm(q.data) : undefined,
  });
  useEffect(() => {
    if (q.data) reset(toForm(q.data));
  }, [q.data, reset]);

  const serverFields = fieldErrors(update.error);

  const onSubmit = (values: FormValues) => {
    if (!q.data) return;
    if (!values.firstName.trim() || !values.lastName.trim() || !values.email.trim()) {
      toast.show({ message: t('users.edit.required'), tone: 'warning' });
      return;
    }
    const changes = diff(toForm(q.data), values);
    if (Object.keys(changes).length === 0) {
      router.back();
      return;
    }
    update.mutate(changes, {
      onSuccess: () => {
        toast.show({ message: t('users.edit.saved'), tone: 'success' });
        router.back();
      },
    });
  };

  return (
    <ScrollScreen>
      <AppHeader title={t('users.edit.title')} showBack />
      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !q.data ? (
        <Section spacing="lg">
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </Section>
      ) : (
        <Section spacing="lg" style={{ rowGap: theme.spacing.md }}>
          {update.isError ? <Alert tone="danger" message={apiErrorMessage(update.error)} /> : null}
          <FormField
            control={control}
            name="firstName"
            label={t('users.edit.firstName')}
            serverError={serverFields.firstName}
          />
          <FormField
            control={control}
            name="lastName"
            label={t('users.edit.lastName')}
            serverError={serverFields.lastName}
          />
          <FormField
            control={control}
            name="email"
            label={t('users.edit.email')}
            keyboardType="email-address"
            autoCapitalize="none"
            serverError={serverFields.email}
          />
          <FormField
            control={control}
            name="phone"
            label={t('users.detail.phoneLabel')}
            keyboardType="phone-pad"
            serverError={serverFields.phone}
          />
          <CountrySelect
            control={control}
            name="country"
            label={tr('petOwner.countryLabel')}
            placeholder={tr('petOwner.countryPlaceholder')}
            serverError={serverFields.country}
          />
          <GovernorateSelect
            control={control}
            name="governorate"
            countryName="country"
            label={tr('petOwner.governorateLabel')}
            placeholder={tr('petOwner.governoratePlaceholder')}
            selectCountryFirst={tr('petOwner.governorateSelectCountryFirst')}
            serverError={serverFields.governorate}
          />
          <GenderRadioGroup control={control} name="gender" label={tr('petOwner.genderLabel')} />
          <FormField
            control={control}
            name="specialization"
            label={t('users.edit.specialization')}
            serverError={serverFields.specialization}
          />
          <Button
            label={t('users.edit.save')}
            fullWidth
            loading={update.isPending}
            disabled={update.isPending}
            onPress={handleSubmit(onSubmit)}
          />
        </Section>
      )}
    </ScrollScreen>
  );
}
