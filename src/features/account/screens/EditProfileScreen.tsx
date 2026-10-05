import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/actions';
import { Avatar, Card, Icon } from '@/components/content';
import { useToast } from '@/components/feedback';
import { Input, Select } from '@/components/forms';
import { ScrollScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Text } from '@/components/typography';
import { governoratesFor } from '@/constants/governorates';
import { Routes } from '@/constants/routes';
import { useAuth } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { pickImage } from '@/services/media';
import { useTheme } from '@/theme';
import { fullName } from '@/utils';

import type { UpdateMyProfileInput } from '../api/accountApi';
import { useUpdateMyProfile, useUploadMyAvatar } from '../hooks/useMyProfile';

/** Same rule as the server's `phoneSchema`. */
const PHONE_RE = /^\+?[0-9][0-9\s\-()]{5,23}$/;
const BIO_MAX = 1000;
const DEFAULT_COUNTRY = 'IQ';

type Field =
  'firstName' | 'lastName' | 'phone' | 'whatsapp' | 'governorate' | 'specialization' | 'bio';

/**
 * Route `/(app)/profile/edit` — "تعديل الملف الشخصي" (reference design). Writes
 * through `PATCH /users/me` (strict server allow-list); the email is shown
 * read-only (it needs re-verification), the photo goes through the existing
 * avatar upload, and "تغيير كلمة المرور" opens the change-password screen.
 * Only changed fields are sent.
 */
export default function EditProfileScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { t } = useTranslation('profile');
  const { user } = useAuth();
  const update = useUpdateMyProfile();
  const uploadAvatar = useUploadMyAvatar();

  const initial = useMemo<Record<Field, string>>(
    () => ({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
      whatsapp: user?.whatsapp ?? '',
      governorate: user?.governorate ?? '',
      specialization: user?.specialization ?? '',
      bio: user?.bio ?? '',
    }),
    // seed once per user — later session refreshes must not wipe in-progress edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id],
  );
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const showSpecialization = Boolean(
    user && (user.veterinarianStatus !== 'NOT_APPLIED' || user.registrationType === 'VETERINARIAN'),
  );
  const country = user?.country ?? DEFAULT_COUNTRY;
  const governorateList = governoratesFor(country);
  const governorateOptions = useMemo(
    () => (governorateList ?? []).map((g) => ({ value: g, label: g })),
    [governorateList],
  );

  const set = (field: Field) => (text: string) => {
    setValues((v) => ({ ...v, [field]: text }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = (): Partial<Record<Field, string>> => {
    const e: Partial<Record<Field, string>> = {};
    if (!values.firstName.trim()) e.firstName = t('edit.required');
    if (!values.lastName.trim()) e.lastName = t('edit.required');
    if (values.phone.trim() && !PHONE_RE.test(values.phone.trim()))
      e.phone = t('edit.invalidPhone');
    if (values.whatsapp.trim() && !PHONE_RE.test(values.whatsapp.trim())) {
      e.whatsapp = t('edit.invalidPhone');
    }
    if (values.bio.trim().length > BIO_MAX) e.bio = t('edit.bioTooLong');
    return e;
  };

  const buildPatch = (): UpdateMyProfileInput => {
    const patch: UpdateMyProfileInput = {};
    const changed = (f: Field) => values[f].trim() !== initial[f].trim();
    const orNull = (f: Field) => values[f].trim() || null;
    if (changed('firstName')) patch.firstName = values.firstName.trim();
    if (changed('lastName')) patch.lastName = values.lastName.trim();
    if (changed('phone')) patch.phone = orNull('phone');
    if (changed('whatsapp')) patch.whatsapp = orNull('whatsapp');
    if (changed('bio')) patch.bio = orNull('bio');
    if (showSpecialization && changed('specialization')) {
      patch.specialization = orNull('specialization');
    }
    if (changed('governorate')) {
      patch.governorate = orNull('governorate');
      // a governorate is validated against its country (Iraq's fixed list)
      if (patch.governorate && !user?.country) patch.country = DEFAULT_COUNTRY;
    }
    return patch;
  };

  const save = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    const patch = buildPatch();
    if (Object.keys(patch).length === 0) {
      toast.show({ tone: 'info', message: t('edit.nothingChanged') });
      return;
    }
    update.mutate(patch, {
      onSuccess: () => {
        toast.show({ tone: 'success', message: t('edit.saved') });
        router.back();
      },
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });
  };

  const changePhoto = async () => {
    try {
      const file = await pickImage({ edit: { aspects: ['1:1'], defaultAspect: '1:1' } });
      if (!file) return;
      await uploadAvatar.mutateAsync(file);
      toast.show({ tone: 'success', message: t('photoUpdated') });
    } catch {
      toast.show({ tone: 'danger', message: t('photoFailed') });
    }
  };

  const name = user ? fullName(user.firstName, user.lastName) : '';
  const half = { flex: 1, minWidth: 150 } as const;

  return (
    <ScrollScreen padded={false}>
      <AppHeader title={t('edit.title')} showBack />
      <View
        style={{
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center',
          paddingHorizontal: theme.screenPadding,
          paddingTop: theme.spacing.md,
          rowGap: theme.spacing.lg,
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <View>
            <Avatar uri={user?.avatarUrl} name={name} size={128} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('changePhoto')}
              disabled={uploadAvatar.isPending}
              onPress={() => void changePhoto()}
              style={{
                position: 'absolute',
                bottom: 2,
                insetInlineEnd: 2,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.colors.primaryPressed,
                borderWidth: 3,
                borderColor: theme.colors.background,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: uploadAvatar.isPending ? 0.6 : 1,
              }}
            >
              <Icon name="camera" size="iconSm" color="onPrimary" />
            </Pressable>
          </View>
        </View>

        <Row>
          <View style={half}>
            <Input
              label={t('edit.firstName')}
              value={values.firstName}
              onChangeText={set('firstName')}
              error={errors.firstName}
              leftIcon="person-outline"
              maxLength={100}
              required
            />
          </View>
          <View style={half}>
            <Input
              label={t('edit.lastName')}
              value={values.lastName}
              onChangeText={set('lastName')}
              error={errors.lastName}
              maxLength={100}
              required
            />
          </View>
        </Row>

        <Input
          label={t('edit.email')}
          value={user?.email ?? ''}
          editable={false}
          leftIcon="mail-outline"
          hint={t('edit.emailLocked')}
        />

        <Row>
          <View style={half}>
            <Input
              label={t('edit.phone')}
              value={values.phone}
              onChangeText={set('phone')}
              error={errors.phone}
              leftIcon="call-outline"
              keyboardType="phone-pad"
              maxLength={24}
            />
          </View>
          <View style={half}>
            <Input
              label={t('edit.whatsapp')}
              value={values.whatsapp}
              onChangeText={set('whatsapp')}
              error={errors.whatsapp}
              leftIcon="logo-whatsapp"
              keyboardType="phone-pad"
              maxLength={24}
            />
          </View>
        </Row>

        <Row>
          <View style={half}>
            {governorateList ? (
              <Select
                label={t('edit.governorate')}
                placeholder={t('edit.governoratePlaceholder')}
                value={values.governorate || null}
                options={governorateOptions}
                onChange={set('governorate')}
                error={errors.governorate}
              />
            ) : (
              <Input
                label={t('edit.governorate')}
                value={values.governorate}
                onChangeText={set('governorate')}
                leftIcon="location-outline"
                maxLength={100}
              />
            )}
          </View>
          {showSpecialization ? (
            <View style={half}>
              <Input
                label={t('edit.specialization')}
                placeholder={t('edit.specializationPlaceholder')}
                value={values.specialization}
                onChangeText={set('specialization')}
                leftIcon="medkit-outline"
                maxLength={120}
              />
            </View>
          ) : null}
        </Row>

        <Input
          label={t('edit.bio')}
          placeholder={t('edit.bioPlaceholder')}
          value={values.bio}
          onChangeText={set('bio')}
          error={errors.bio}
          hint={`${values.bio.trim().length}/${BIO_MAX}`}
          leftIcon="briefcase-outline"
          multiline
          numberOfLines={5}
          maxLength={BIO_MAX + 50}
        />

        <Card padding="none" variant="outlined">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('edit.changePassword')}
            onPress={() => router.push(Routes.settingsChangePassword)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: theme.spacing.md,
              padding: theme.spacing.lg,
            }}
          >
            <Icon name="lock-closed-outline" size="iconMd" color="primary" />
            <Text variant="bodyMedium" style={{ flex: 1 }}>
              {t('edit.changePassword')}
            </Text>
            <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
          </Pressable>
        </Card>

        <Button
          label={t('edit.save')}
          fullWidth
          loading={update.isPending}
          disabled={update.isPending}
          onPress={save}
        />
      </View>
    </ScrollScreen>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
      {children}
    </View>
  );
}
